import { useMemo } from "react";
import { useAuthStore } from "@/features/auth";
import { createPermissionChecker } from "@/shared/lib/permissions";
import type { IIdentity } from "@/shared/types/identity";

export const usePermission = () => {
  const { user, isLoading } = useAuthStore();

  const identity: IIdentity | null = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      role: user.role,
      roles: user.roles,
      permissions: user.permissions,
    };
  }, [user]);

  const checker = useMemo(() => createPermissionChecker(identity), [identity]);

  return useMemo(
    () => ({
      ...checker,
      isLoading,
    }),
    [checker, isLoading],
  );
};
