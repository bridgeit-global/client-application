import { Icons } from '@/components/icons';
export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isCollapsible?: boolean;
  items?: NavItem[];
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

export type ChartData = {
  [key: string]: any;
  totalAmount: number;
};

export type SiteFormValues = {
  siteId: string;
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  zone_id: string;
  type: string;
  connections: Array<{
    billerBoard: string;
    payType: string;
    parameters: Array<{
      key: string;
      value: string;
      validation: string;
      message: string;
    }>;
  }>;
};

export interface SiteFormType {
  initialData: any;
}

export type SearchParamsProps = {
  [key: string]: string | undefined;
};

export type DocumentType = 'gst' | 'pan' | 'cin';

export interface UserRequest {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  companyName: string;
  documentType: DocumentType;
  documentNumber: string;
  createdAt: string;
  updatedAt: string;
}
