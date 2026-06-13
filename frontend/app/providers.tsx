"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
  ssr: false,
});

import { MSWProvider, useMSW } from "@/shared/components/providers/msw-provider";
import { NetworkStatusProvider } from "@/shared/components/providers/network-status-provider";
import { LoggerProvider } from "@/shared/components/providers/logger-provider";
import { ThemeProvider } from "@/shared/components/providers/theme-provider";
import { useAuth } from "@/features/auth";
import { createQueryClient } from "@/infra/api/query-client";
import { apiErrorHandler } from "@/infra/api/error-handler";
import { useTranslations } from "next-intl";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isReady: mswReady } = useMSW();
  const { user, isLoading, fetchMe } = useAuth();
  const t = useTranslations("Api.errors");
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Set translations for the global error handler
    apiErrorHandler.setTranslations(t);
  }, [t]);


  useEffect(() => {
    // Only fetch once on initial mount if MSW is ready and not already loaded
    if (mswReady && !hasInitialized.current && !user && !isLoading) {
      hasInitialized.current = true;
      fetchMe();
    }
  }, [mswReady, user, isLoading, fetchMe]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LoggerProvider>
          <MSWProvider>
            <NetworkStatusProvider>
              <AuthInitializer>{children}</AuthInitializer>
            </NetworkStatusProvider>
          </MSWProvider>
        </LoggerProvider>
        <Toaster position="top-right" richColors />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
