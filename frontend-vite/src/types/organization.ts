export type OrganizationType =
  | "SCHOOL"
  | "COMPANY"
  | "HOTEL"
  | "RESIDENCE"
  | "COMMERCIAL"
  | "OTHER";


export type Organization = {
  id: number;

  name: string;
  slug: string;

  type:
    OrganizationType;

  logo:
    string | null;

  logo_url:
    string | null;

  email: string;
  phone: string;
  address: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};


export type OrganizationUpdateInput = {
  name: string;

  type:
    OrganizationType;

  email: string;
  phone: string;
  address: string;
};
