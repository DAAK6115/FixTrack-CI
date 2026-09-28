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

  image:
    string | null;

  image_url:
    string | null;

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

  image?: File | null;

  installation_date?:
    string | null;

  status:
    EquipmentStatus;

  description?: string;
  notes?: string;
};



export type EquipmentAuditLog = {
  id: number;

  action:
    | "UPDATE"
    | "DELETE_REQUESTED"
    | "DELETE_APPROVED"
    | "DELETE_REJECTED";

  action_label: string;

  justification: string;

  performed_by: number;

  performed_by_name: string;
  performed_by_email: string;

  before_data:
    Record<string, unknown>;

  after_data:
    Record<string, unknown>;

  created_at: string;
};



export type EquipmentDeletionRequest = {
  id: number;

  equipment: number;

  equipment_code: string;
  equipment_name: string;

  equipment_image_url:
    string | null;

  requested_by: number;

  requested_by_name: string;
  requested_by_email: string;

  justification: string;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  status_label: string;

  reviewed_by:
    number | null;

  reviewed_by_name:
    string | null;

  reviewed_by_email:
    string | null;

  review_note: string;

  requested_at: string;

  reviewed_at:
    string | null;
};


export type PendingEquipmentDeletion = {
  pending: boolean;

  request:
    EquipmentDeletionRequest
    | null;
};



export type ArchivedEquipmentRecord = {
  equipment: Equipment;

  deletion:
    EquipmentDeletionRequest
    | null;
};


export type EquipmentPrintContext = {
  organization_name: string;
  organization_logo: string;
};
