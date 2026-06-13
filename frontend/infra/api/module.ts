import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

import { locales, defaultLocale, LOCALE_COOKIE } from "@/shared/config/i18n";

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

/**
 * Generate a request id. `crypto.randomUUID()` only exists in secure contexts
 * (HTTPS/localhost); on a plain-HTTP LAN deployment it is undefined and calling
 * it would throw inside the request interceptor, breaking EVERY request. Fall
 * back to a non-crypto id there — uniqueness for tracing, not security.
 */
function generateRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Reads the active locale from the NEXT_LOCALE cookie (the same cookie the
 * `setLocale` server action writes). Used to tell the backend which language
 * to localize its responses in via the Accept-Language header.
 */
function getClientLocale(): string {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`),
  );
  const value = match?.[1];
  return value && (locales as readonly string[]).includes(value)
    ? value
    : defaultLocale;
}

function setContentTypeHeader(
  config: InternalAxiosRequestConfig,
  value: string,
): void {
  if (typeof config.headers?.set === "function") {
    config.headers.set("Content-Type", value);
    return;
  }
  (config.headers as Record<string, unknown>)["Content-Type"] = value;
}

function deleteContentTypeHeader(config: InternalAxiosRequestConfig): void {
  if (typeof config.headers?.delete === "function") {
    config.headers.delete("Content-Type");
    return;
  }
  delete (config.headers as Record<string, unknown>)["Content-Type"];
}

class HttpModule {
  private readonly instance: AxiosInstance;

  constructor(baseURL: string, timeout: number = 50000) {
    this.instance = axios.create({
      baseURL,
      timeout,
      // Sanctum SPA mode: send the session + XSRF cookies with every request,
      // and let axios mirror the XSRF-TOKEN cookie into the X-XSRF-TOKEN header.
      withCredentials: true,
      // Required since axios 1.6: cookie->header XSRF mirroring is skipped for
      // cross-origin requests (frontend :3000 -> backend :8000) unless this is
      // explicitly true. Without it Laravel rejects logins with a CSRF mismatch.
      withXSRFToken: true,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-XSRF-TOKEN",
    });

    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        // Note: Content-Security-Policy is a *response* header and is ignored
        // when sent on a request, so it is intentionally not set here. CSP must
        // be configured server-side (e.g. Next.js headers / backend response).
        config.headers.set("X-Request-ID", generateRequestId());
        // Forward the active UI locale so the backend localizes its responses
        // (validation/error messages) to match. Server-side requests set this
        // explicitly in getServerHttpClient() instead.
        if (typeof window !== "undefined") {
          config.headers.set("Accept-Language", getClientLocale());
        }
        if (!isFormData(config.data)) {
          setContentTypeHeader(config, "application/json");
        } else {
          deleteContentTypeHeader(config);
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse): AxiosResponse => {
        return response;
      },
      (error: AxiosError) => {
        // Có lỗi 401 thì gọi handleApiError để intercept redirect về login
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            import('./error-handler').then(({ handleApiError }) => {
              handleApiError(error);
            });
        }
        return Promise.reject(error);
      },
    );
  }

  getInstance(): AxiosInstance {
    return this.instance;
  }
}

export default HttpModule;
