import { MenuItem, BreadcrumbItem } from "@/shared/types/menu";
import { menuConfig } from "@/shared/config/menu";
import type { IPermissionChecker } from "@/shared/types/identity";
import { filterMenuByPermissions, generateBreadcrumbs } from "@/shared/lib/menu-utils";

/**
 * NavigationService provides high-leverage methods for UI navigation components.
 * It encapsulates menu configuration and filtering logic.
 */
export class NavigationService {
  private readonly config: MenuItem[];

  constructor(config: MenuItem[] = menuConfig) {
    this.config = config;
  }

  /**
   * Returns the menu items authorized for the given permission checker.
   */
  public getAuthorizedMenu(checker: IPermissionChecker, items: MenuItem[] = this.config): MenuItem[] {
    return filterMenuByPermissions(items, checker);
  }

  /**
   * Generates breadcrumbs for a given pathname.
   */
  public getBreadcrumbs(
    pathname: string,
    t: (key: string) => string
  ): BreadcrumbItem[] {
    return generateBreadcrumbs(this.config, pathname, t);
  }

  /**
   * Returns the raw menu configuration.
   */
  public getRawMenu(): MenuItem[] {
    return this.config;
  }
}

// Singleton instance for general use
export const navigationService = new NavigationService();
