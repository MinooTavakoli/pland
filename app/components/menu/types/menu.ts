import { ReactNode } from "react";

export interface MenuItem {
  id: string;
  title: string;
  href?: string;
  icon?: ReactNode;
  children?: MenuItem[];
}

export interface NavbarItem {
  id: string;
  title: string;
  href?: string;
  megaMenu?: boolean;
}
