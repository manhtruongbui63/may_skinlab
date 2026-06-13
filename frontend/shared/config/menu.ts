import { LayoutDashboard, Users, Calendar } from "lucide-react";
import { MenuItem } from "../types/menu";

export const menuConfig: MenuItem[] = [
  {
    id: "dashboard",
    label: "menu.dashboard",
    icon: LayoutDashboard,
    path: "/",
    exact: true,
  },
  {
    id: "customers",
    label: "customers.title",
    icon: Users,
    path: "/customers",
  },
  {
    id: "appointments",
    label: "appointments.title",
    icon: Calendar,
    path: "/appointments",
  },
];
