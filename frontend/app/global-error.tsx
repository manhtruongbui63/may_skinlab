"use client";

import { useEffect } from "react";
import { logger } from "@/infra/logging/logger";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report the root-level crash to the backend log channel.
    logger.captureException(error, { kind: "global-error", digest: error.digest }, "critical");
  }, [error]);

  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          color: "#fafafa",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "480px",
          }}
        >
          <p
            style={{
              fontSize: "5rem",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              margin: 0,
              lineHeight: 1,
              color: "#ef4444",
            }}
          >
            500
          </p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "1rem 0 0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#a1a1aa",
              fontSize: "0.875rem",
              margin: "0 0 2rem",
            }}
          >
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span
                style={{
                  display: "block",
                  marginTop: "0.5rem",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "#71717a",
                }}
              >
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              background: "#fafafa",
              color: "#09090b",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
            }
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
