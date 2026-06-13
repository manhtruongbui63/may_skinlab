import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { navigationService } from "@/shared/services/navigation.service";
import { usePermission } from "./use-permission";

/**
 * Hook to access navigation logic with integrated permission checking.
 */
export const useNavigation = () => {
  const checker = usePermission();
  const pathname = usePathname();
  const t = useTranslations();

  const authorizedMenu = useMemo(
    () => navigationService.getAuthorizedMenu(checker),
    [checker]
  );

  const breadcrumbs = useMemo(
    () => navigationService.getBreadcrumbs(pathname, t),
    [pathname, t]
  );

  return {
    menu: authorizedMenu,
    breadcrumbs,
    checker,
    pathname,
  };
};
