export type NotificationType =
  | "INCIDENT_REPORTED"
  | "INCIDENT_VALIDATED"
  | "INCIDENT_REJECTED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_REASSIGNED"
  | "INCIDENT_ASSIGNMENT_REMOVED"
  | "INCIDENT_TECHNICIAN_ASSIGNED"
  | "INTERVENTION_STARTED"
  | "INTERVENTION_ON_HOLD"
  | "INTERVENTION_RESUMED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_CLOSED"
  | "EQUIPMENT_DELETION_REQUESTED"
  | "EQUIPMENT_DELETION_APPROVED"
  | "EQUIPMENT_DELETION_REJECTED";


export type FixTrackNotification = {
  id: number;

  notification_type:
    NotificationType;

  type_label: string;

  title: string;
  message: string;

  is_read: boolean;

  read_at:
    string | null;

  created_at: string;

  incident:
    number | null;

  incident_reference:
    string | null;

  incident_title:
    string | null;
};
