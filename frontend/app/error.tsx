"use client";

import { useEffect } from "react";
import { logger } from "@/infra/logging/logger";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.captureException(error, { kind: "route-error", digest: error.digest });
  }, [error]);

  return (
    <div>
      <h1>500</h1>
      <button onClick={() => reset()}>Retry</button>
    </div>
  );
}
