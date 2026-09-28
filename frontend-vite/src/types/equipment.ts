export type EquipmentStatus =
  | "ACTIVE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";


export type EquipmentCategory = {
  id: number;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
};


export type Equipment = {
  id: number;

  code: string;
  name: string;

  category: number;
  category_name: string;
  category_icon: string;

  location: number;
  location_name: string;
  floor_name: string;
  building_name: string;
  site_name: string;
  site_address: string;

  brand: string;
  model_name: string;
  serial_number: string;

  installation_date:
    string | null;

  status: EquipmentStatus;
  status_label: string;

  description: string;
  notes: string;

  qr_token: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};


export type EquipmentInput = {
  code: string;
  name: string;

  category: number;
  location: number;

  brand?: string;
  model_name?: string;
  serial_number?: string;

  installation_date?:
    string | null;

  status:
    EquipmentStatus;

  description?: string;
  notes?: string;
};
