export type UserRole = "ADMIN" | "MANAGER" | "TECHNICIAN" | "REQUESTER";

export type OrganizationSummary = {
  id: number;
  name: string;
  slug: string;
  type: string;
};

export type CurrentUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar: string;
  role: UserRole;
  organization: OrganizationSummary | null;
  is_active: boolean;
};

export type LoginResponse = {
  access: string;
  refresh: string;
};
