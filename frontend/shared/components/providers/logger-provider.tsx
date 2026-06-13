"use client";

import { useEffect } from "react";
import { logger } from "@/infra/logging/logger";

/**
 * Installs global capture of uncaught errors and unhandled promise rejections,
 * forwarding them to the backend log channel (Sentry-style auto-capture).
 *
 * Component-level React errors are still caught by error.tsx / global-error.tsx,
 * which log explicitly; this catches everything that escapes React.
 */
export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.captureException(event.error ?? event.message, {
        kind: "window.onerror",
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.captureException(event.reason, { kind: "unhandledrejection" });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return <>{children}</>;
}
