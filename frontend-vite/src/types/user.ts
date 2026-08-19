import type { UserRole } from "./auth";

export type ManagedUser = {
  id: number;

  email: string;

  first_name: string;
  last_name: string;
  full_name: string;

  phone: string;
  avatar: string;

  role: UserRole;

  organization_name: string;

  is_active: boolean;

  date_joined: string;
};

export type UserInput = {
  email: string;

  first_name: string;
  last_name: string;

  phone: string;

  role: UserRole;

  is_active?: boolean;

  password?: string;
};