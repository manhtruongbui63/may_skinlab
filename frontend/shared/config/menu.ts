import { LayoutDashboard, Users, Calendar, Stethoscope } from "lucide-react";
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
    id: "reception",
    label: "menu.reception",
    icon: Stethoscope,
    path: "/reception",
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
