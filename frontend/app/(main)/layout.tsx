import { AppShell } from "@/shared/components/layout/app-shell";
import { cookies } from "next/headers";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true";

  return <AppShell initialCollapsed={isCollapsed}>{children}</AppShell>;
}
