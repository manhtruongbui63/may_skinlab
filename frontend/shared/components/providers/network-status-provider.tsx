"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const t = useTranslations("Network");
  const isOfflineRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => {
      if (isOfflineRef.current) {
        isOfflineRef.current = false;
        
        toast.success(t("online"), {
          id: "network-status",
          duration: 3000,
        });

        // Trigger TanStack Query to refetch active queries
        queryClient.refetchQueries({ type: 'active' });
      }
    };

    const handleOffline = () => {
      if (!isOfflineRef.current) {
        isOfflineRef.current = true;
        toast.error(t("offline"), {
          id: "network-status",
          duration: Infinity, 
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof window !== "undefined" && !window.navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient, t]);

  return <>{children}</>;
}
