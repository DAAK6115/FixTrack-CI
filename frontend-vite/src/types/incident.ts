export type IncidentPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";


export type IncidentStatus =
  | "REPORTED"
  | "VALIDATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED"
  | "CANCELLED";


export type IncidentCategory = {
  id: number;
  name: string;
  icon: string;
  description: string;
  is_active: boolean;
};


export type IncidentMedia = {
  id: number;
  url: string;
  caption: string;
  created_at: string;
};


export type IncidentHistory = {
  id: number;

  previous_status:
    IncidentStatus | null;

  previous_status_label:
    string | null;

  new_status:
    IncidentStatus;

  new_status_label: string;

  changed_by_name: string;

  comment: string;

  created_at: string;
};


export type IncidentListItem = {
  id: number;

  reference: string;
  title: string;

  category: number;
  category_name: string;

  location: number;
  location_name: string;

  building_name: string;
  site_name: string;

  reported_by_name: string;

  requested_priority:
    IncidentPriority;

  requested_priority_label:
    string;

  validated_priority:
    IncidentPriority | null;

  status:
    IncidentStatus;

  status_label: string;

  reported_at: string;

  cover_image: string | null;
};


export type IncidentDetail = {
  id: number;

  reference: string;

  title: string;
  description: string;

  category: number;

  category_detail: {
    id: number;
    name: string;
    icon: string;
    description: string;
    is_active: boolean;
  };

  location: number;

  location_detail: {
    id: number;
    name: string;
    code: string;

    floor: {
      id: number;
      name: string;
      level: number;
    };

    building: {
      id: number;
      name: string;
      code: string;
    };

    site: {
      id: number;
      name: string;
      address: string;
    };
  };

  reported_by: {
    id: number;
    name: string;
    email: string;
  };

  requested_priority:
    IncidentPriority;

  requested_priority_label:
    string;

  validated_priority:
    IncidentPriority | null;

  validated_priority_label:
    string | null;

  status:
    IncidentStatus;

  status_label: string;

  latitude: string | null;
  longitude: string | null;

  reported_at: string;

  assigned_at: string | null;
  started_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;

  media: IncidentMedia[];

  status_history:
    IncidentHistory[];

  created_at: string;
  updated_at: string;
};


export type IncidentFilters = {
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  site?: string;
};


export type CreateIncidentInput = {
  category: number;
  location: number;

  title: string;
  description: string;

  requested_priority:
    IncidentPriority;

  latitude?: string;
  longitude?: string;

  images: File[];
};