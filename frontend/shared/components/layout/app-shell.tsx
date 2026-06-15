"use client";

import React, { useRef, useState } from "react";
import { PageContentTransition } from "./page-content-transition";
import { Menu as MenuIcon, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { SidebarMenu } from "../menu/sidebar-menu";
import { Breadcrumb } from "../menu/breadcrumb";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { menuConfig } from "@/shared/config/menu";
import { cn } from "@/shared/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@bks/ds-system-sdk";
import { Link } from "@/i18n/routing";
import { ChangePasswordDialog } from "@/features/auth";
import { useAuth } from "@/features/auth";

interface AppShellProps {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, initialCollapsed = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      document.cookie = `sidebar-collapsed=${next}; path=/; max-age=31536000; SameSite=Lax`;
      return next;
    });
  };

  const t = useTranslations("Common");
  const tAuth = useTranslations("ChangePassword");
  const { user, logout, isInitialized } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
    setIsLogoutOpen(false);
    const callbackUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full",
          isCollapsed && "lg:w-20"
        )}
      >
        <div className={cn(
          "flex h-16 items-center justify-between border-b px-6 shrink-0 relative",
          isCollapsed && "px-4 justify-center"
        )}>
          {isCollapsed ? (
            <div className="relative group/logo flex items-center justify-center h-10 w-10">
              <span className="text-xl font-bold tracking-tight group-hover/logo:hidden">{t("logo").charAt(0).toUpperCase()}</span>
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:group-hover/logo:flex text-muted-foreground hover:text-foreground cursor-pointer absolute inset-0 items-center justify-center rounded-md hover:bg-muted"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <span className="text-xl font-bold tracking-tight">{t("logo")}</span>
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:block text-muted-foreground hover:text-foreground cursor-pointer p-1.5 rounded-md hover:bg-muted"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </button>
            </>
          )}

          <button
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <SidebarMenu items={menuConfig} isCollapsed={isCollapsed} />
        </div>

        {user && (
          <div className="border-t p-4 shrink-0">
            {/* User Profile / Logout Trigger */}
            <button
              onClick={() => setIsLogoutOpen(true)}
              className={cn(
                "flex w-full items-center rounded-lg p-2 transition-colors hover:bg-secondary/70 cursor-pointer",
                isCollapsed ? "justify-center" : "space-x-3 bg-secondary/50 text-left"
              )}
            >
              <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/20 font-bold text-primary shrink-0">
                {user?.avatar ? (
                  <Image src={user.avatar} alt="Avatar" fill className="object-cover" sizes="32px" />
                ) : (
                  <>{user?.name?.charAt(0).toUpperCase() || "U"}</>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex-1 truncate text-xs">
                  <p className="font-semibold">{user?.name || t("userName")}</p>
                  <p className="opacity-60">{user?.email || t("userEmail")}</p>
                </div>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          "fixed top-0 right-0 z-30 flex h-16 items-center border-b bg-card px-4 lg:px-8 transition-all duration-300 left-0",
          isCollapsed ? "lg:left-20" : "lg:left-64"
        )}>
          <button
            className="mr-4 text-muted-foreground hover:text-foreground lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          <div className="flex-1 overflow-hidden">
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {!isInitialized ? (
              <div className="h-9 w-24" />
            ) : user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                {tAuth("trigger")}
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    {t("login")}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    {t("register")}
                  </Button>
                </Link>
              </>
            )}
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </header>

        {/* Content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto bg-muted/20 mt-16 p-6"
        >
          <div className="mx-auto">
            <PageContentTransition scrollContainerRef={mainRef}>
              {children}
            </PageContentTransition>
          </div>
        </main>
      </div>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />

      <AlertDialog open={isLogoutOpen} onOpenChange={setIsLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống? Các phiên làm việc hiện tại sẽ bị kết thúc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
