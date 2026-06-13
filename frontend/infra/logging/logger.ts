/**
 * Client-side logger — a lightweight, self-hosted alternative to Sentry.
 *
 * Captured events are batched and shipped to the backend `POST /api/logs`
 * endpoint, which persists them to the dedicated `frontend` log channel.
 *
 * Design notes:
 * - Uses raw `fetch` / `navigator.sendBeacon` instead of the shared axios
 *   `HttpService`. That keeps logging off the axios error-handler chain, so a
 *   failed log request can never trigger a toast/redirect or, worse, recurse
 *   into logging its own failure.
 * - Events are buffered and flushed on a timer, on buffer overflow, and on
 *   page hide (via `sendBeacon`, which survives unload).
 */

export type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "emergency";

export type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
}

const MAX_BATCH = 20;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 100;

function getEndpoint(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  return `${base.replace(/\/$/, "")}/api/logs`;
}

/**
 * Remote logging is disabled in mock mode (no real backend) and can be turned
 * off explicitly with NEXT_PUBLIC_ENABLE_REMOTE_LOG=false.
 */
function isRemoteEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") return false;
  return process.env.NEXT_PUBLIC_ENABLE_REMOTE_LOG !== "false";
}

function readXsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return { value: String(error) };
}

const REDACTED = "[REDACTED]";

/**
 * Keys whose values must never be shipped to the log backend.
 *
 * - SUBSTRING terms are matched anywhere (case-insensitive), so
 *   "currentPassword", "X-XSRF-TOKEN", "auth_token" are all caught.
 * - EXACT terms are short/ambiguous (pin, card, …) and only match a whole key,
 *   so harmless keys like "shipping" or "dashboard" are not over-redacted.
 */
const SENSITIVE_SUBSTRING =
  /pass|secret|token|auth|cookie|credential|session|xsrf|api[-_]?key|private[-_]?key/i;
const SENSITIVE_EXACT =
  /^(otp|pin|cvv|ssn|card|card[-_]?number|credit[-_]?card|account[-_]?number)$/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_SUBSTRING.test(key) || SENSITIVE_EXACT.test(key);
}

const MAX_REDACT_DEPTH = 6;

/**
 * Deep-copy a log context, replacing any sensitive value with "[REDACTED]".
 *
 * Logging must never persist credentials/PII to the backend `frontend` channel,
 * so request bodies/headers a caller passes (containing passwords, bearer/XSRF
 * tokens, cookies, …) are masked here before they ever leave the browser.
 * Cycles and excessive depth are handled defensively so logging cannot throw.
 */
function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_REDACT_DEPTH) return "[Truncated]";

  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key) ? REDACTED : redact(val, depth + 1, seen);
  }
  return out;
}

function redactContext(context: LogContext): LogContext {
  return redact(context) as LogContext;
}

/**
 * Redact secrets embedded in a URL string. `redact()` only masks by object KEY,
 * so a token/OTP living in the query string or hash fragment (e.g.
 * `/reset?token=…`, `#access_token=…`) would otherwise be shipped verbatim.
 * Here we mask the VALUE of any sensitive query/hash param while preserving the
 * path for debugging.
 */
function redactUrl(href: string): string {
  try {
    const url = new URL(href);

    url.searchParams.forEach((_value, key) => {
      if (isSensitiveKey(key)) url.searchParams.set(key, REDACTED);
    });

    // The hash can carry credentials too (OAuth implicit flow uses `#token=…`).
    if (url.hash.length > 1) {
      const hashParams = new URLSearchParams(url.hash.slice(1));
      let changed = false;
      hashParams.forEach((_value, key) => {
        if (isSensitiveKey(key)) {
          hashParams.set(key, REDACTED);
          changed = true;
        }
      });
      if (changed) url.hash = hashParams.toString();
    }

    return url.toString();
  } catch {
    return href;
  }
}

class Logger {
  private queue: LogEntry[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listenersBound = false;

  public debug(message: string, context?: LogContext): void {
    this.capture("debug", message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.capture("info", message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.capture("warning", message, context);
  }

  public error(message: string, context?: LogContext): void {
    this.capture("error", message, context);
  }

  /**
   * Capture a thrown value with its stack, Sentry-style.
   */
  public captureException(
    error: unknown,
    context?: LogContext,
    level: LogLevel = "error",
  ): void {
    const err = serializeError(error);
    const message =
      typeof err.message === "string" && err.message ? err.message : "Unhandled exception";
    this.capture(level, message, { ...context, error: err });
  }

  private capture(level: LogLevel, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      const consoleMethod =
        level === "debug" || level === "info" ? "log" : level === "warning" ? "warn" : "error";
      // eslint-disable-next-line no-console
      console[consoleMethod](`[logger:${level}]`, message, context ?? "");
    }

    if (!isRemoteEnabled()) return;

    const entry: LogEntry = {
      level,
      message,
      // Redact sensitive fields before the context is queued for the backend.
      context: redactContext({ url: redactUrl(window.location.href), ...context }),
      timestamp: new Date().toISOString(),
    };

    this.queue.push(entry);
    // Drop oldest entries if a flush keeps failing, so we never grow unbounded.
    if (this.queue.length > MAX_QUEUE) {
      this.queue.splice(0, this.queue.length - MAX_QUEUE);
    }

    this.bindUnloadListeners();

    if (this.queue.length >= MAX_BATCH) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL_MS);
    }
  }

  /**
   * Send the buffered entries. `useBeacon` is used on page hide, where an async
   * fetch would be cancelled by the unload.
   */
  public flush(useBeacon = false): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.queue.length === 0) return;

    const logs = this.queue;
    this.queue = [];
    const payload = JSON.stringify({ logs });
    const endpoint = getEndpoint();

    try {
      if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        const ok = navigator.sendBeacon(endpoint, blob);
        if (!ok) this.requeue(logs);
        return;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const xsrf = readXsrfToken();
      if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;

      void fetch(endpoint, {
        method: "POST",
        headers,
        body: payload,
        credentials: "include",
        keepalive: true,
      }).catch(() => {
        // Swallow: logging must never surface its own transport errors.
        this.requeue(logs);
      });
    } catch {
      this.requeue(logs);
    }
  }

  private requeue(logs: LogEntry[]): void {
    this.queue = [...logs, ...this.queue].slice(-MAX_QUEUE);
  }

  private bindUnloadListeners(): void {
    if (this.listenersBound || typeof window === "undefined") return;
    this.listenersBound = true;

    const flushOnHide = () => {
      if (document.visibilityState === "hidden") this.flush(true);
    };
    document.addEventListener("visibilitychange", flushOnHide);
    window.addEventListener("pagehide", () => this.flush(true));
  }
}

export const logger = new Logger();
