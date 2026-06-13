import { AxiosError } from "axios";
import { toast } from "sonner";
import { logger } from "@/infra/logging/logger";
import { useAuthStore } from "@/features/auth/stores/auth.store";

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  [key: string]: unknown;
}

/**
 * Interface for Error Handlers (Chain of Responsibility pattern)
 */
export interface IErrorHandler {
  setNext(handler: IErrorHandler): IErrorHandler;
  handle(error: AxiosError): void;
}

/**
 * Global state to prevent multiple toasts/redirects for the same error cycle
 */
const errorState = {
  isRedirectingToLogin: false,
};

// Expose a way to reset it when successfully logged in or mounted login page
export const resetErrorState = () => {
  errorState.isRedirectingToLogin = false;
};

/**
 * Base Error Handler with default chain logic
 */
abstract class BaseErrorHandler implements IErrorHandler {
  private nextHandler: IErrorHandler | null = null;

  public setNext(handler: IErrorHandler): IErrorHandler {
    this.nextHandler = handler;
    return handler;
  }

  public handle(error: AxiosError): void {
    if (this.nextHandler) {
      this.nextHandler.handle(error);
    }
  }

  protected getFriendlyMessage(status?: number): string {
    const t = apiErrorHandler.translations;
    if (t) {
      const key = status?.toString() || "default";
      try {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        return (t as any)(key) || (t as any)("default");
      } catch {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        try { return (t as any)("default"); } catch { /* ignore */ }
      }
    }

    switch (status) {
      case 400:
        return "Invalid request. Please check again.";
      case 401:
        return "Session expired. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "Requested data not found.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "System is busy. Please try again later.";
      default:
        return "An error occurred. Please try again.";
    }
  }
}

/**
 * Reports API failures to the backend log channel (self-hosted telemetry).
 *
 * Only server errors (>= 500) and network/transport failures (no response) are
 * forwarded — expected client errors like 401/403/404/422 are normal flow and
 * would be noise. The logger uses its own transport, so this never recurses
 * through the axios chain even when the /api/logs call itself fails.
 */
class LoggerHandler extends BaseErrorHandler {
  public override handle(error: AxiosError): void {
    const status = error.response?.status;
    const url = error.config?.url;
    const method = error.config?.method;
    const isAuthCheck = url?.includes("/api/auth/me");
    const isExpectedAuth401 = status === 401 && isAuthCheck;

    if (process.env.NODE_ENV === "development" && !isExpectedAuth401) {
      console.error(
        "[API Error]",
        method?.toUpperCase(),
        url,
        "- Status:",
        status,
        error.response?.data
      );
    }

    const isServerError = typeof status === "number" && status >= 500;
    const isNetworkError = !error.response;
    // Skip our own log-ingest endpoint to avoid feedback loops.
    const isLogEndpoint = url?.includes("/api/logs");

    if ((isServerError || isNetworkError) && !isLogEndpoint) {
      logger.error(`API ${isNetworkError ? "network error" : status} on ${method?.toUpperCase()} ${url}`, {
        kind: "api-error",
        status: status ?? null,
        method: method?.toUpperCase(),
        url,
        response: error.response?.data ?? null,
      });
    }

    super.handle(error);
  }
}

/**
 * Handler for Authentication errors (401)
 */
class AuthHandler extends BaseErrorHandler {
  public override handle(error: AxiosError): void {
    const status = error.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      // Chỉ thực hiện khi đang không ở trang login
      if (!window.location.pathname.startsWith('/login')) {
        // Tránh loop vô tận hoặc redirect nhiều lần
        if (!errorState.isRedirectingToLogin) {
          errorState.isRedirectingToLogin = true;

          const callbackUrl = window.location.pathname + window.location.search;
          const redirectUrl = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

          // Xoá token
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          
          useAuthStore.getState().reset();
          useAuthStore.getState().setLogoutStatus(true);
          
          toast.error(this.getFriendlyMessage(401));
          
          // Chuyển trang qua `window.location.replace`
          window.location.replace(redirectUrl);
        }
      }
      return; 
    }
    super.handle(error);
  }
}

/**
 * Handler for critical error redirects (GET requests only)
 */
class RedirectHandler extends BaseErrorHandler {
  public override handle(error: AxiosError): void {
    const status = error.response?.status;
    const method = error.config?.method?.toLowerCase();
    const isGetRequest = method === "get";

    if (isGetRequest && typeof window !== "undefined") {
      if (status === 403) {
        window.location.href = "/forbidden";
        return;
      }
      if (status === 404) {
        window.location.href = "/not-found";
        return;
      }
    }
    super.handle(error);
  }
}

/**
 * Handler for Toasts (Mutations or specific errors)
 */
class ToastHandler extends BaseErrorHandler {
  public override handle(error: AxiosError): void {
    const status = error.response?.status || 0;
    const method = error.config?.method?.toLowerCase();
    const isMutation = ["post", "put", "delete", "patch"].includes(method || "");
    // No response means a transport/network failure (timeout, DNS, server down).
    // Without this, a failed GET (status 0) would show no feedback at all and
    // leave the user staring at stale/empty UI.
    const isNetworkError = !error.response;

    if (typeof window !== "undefined") {
      if (isMutation || isNetworkError || status >= 500 || status === 403 || status === 404) {
        toast.error(this.getFriendlyMessage(status));
      }
    }
    super.handle(error);
  }
}

/**
 * Facade class to coordinate error handling
 */
export class ApiErrorHandler {
  private readonly chain: IErrorHandler;
  public translations: unknown = null;

  constructor() {
    const logger = new LoggerHandler();
    const auth = new AuthHandler();
    const redirect = new RedirectHandler();
    const toast = new ToastHandler();

    logger.setNext(auth).setNext(redirect).setNext(toast);
    this.chain = logger;
  }

  public setTranslations(t: unknown): void {
    this.translations = t;
  }

  public handle(error: unknown): void {
    if (!(error instanceof AxiosError)) {
      return;
    }
    
    // Nếu request bị huỷ (CancelToken), không hiển thị lỗi
    if (error.message === 'canceled' || error.name === 'CanceledError') {
      return;
    }

    this.chain.handle(error);
  }
}

export const apiErrorHandler = new ApiErrorHandler();
export const handleApiError = (error: unknown) => apiErrorHandler.handle(error);
