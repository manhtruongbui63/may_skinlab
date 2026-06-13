"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/routing";

interface PageContentTransitionProps {
  children: React.ReactNode;
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export function buildPageTransitionKey(locale: string, pathname: string) {
  return `${locale}:${pathname}`;
}

export function PageContentTransition({
  children,
  scrollContainerRef,
}: PageContentTransitionProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "";
  const transitionKey = buildPageTransitionKey(locale, pathname);
  const prevKeyRef = useRef(transitionKey);

  useEffect(() => {
    if (prevKeyRef.current === transitionKey) {
      return;
    }

    prevKeyRef.current = transitionKey;
    scrollContainerRef?.current?.scrollTo({ top: 0, left: 0 });
  }, [transitionKey, scrollContainerRef]);

  return <>{children}</>;
}
