export type Site = {
  id: number;
  organization_name: string;
  name: string;
  address: string;
  latitude: string | null;
  longitude: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Building = {
  id: number;
  site: number;
  site_name: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Floor = {
  id: number;
  building: number;
  building_name: string;
  site_id: number;
  site_name: string;
  name: string;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: number;
  floor: number;
  floor_name: string;

  building_id: number;
  building_name: string;

  site_id: number;
  site_name: string;

  name: string;
  code: string;
  description: string;

  latitude: string | null;
  longitude: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};

export type SiteInput = {
  name: string;
  address: string;
  latitude?: string | null;
  longitude?: string | null;
};

export type BuildingInput = {
  site: number;
  name: string;
  code: string;
};

export type FloorInput = {
  building: number;
  name: string;
  level: number;
};

export type LocationInput = {
  floor: number;
  name: string;
  code: string;
  description: string;
  latitude?: string | null;
  longitude?: string | null;
};