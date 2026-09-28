export type NotificationType =
  | "INCIDENT_REPORTED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_REASSIGNED"
  | "INTERVENTION_STARTED"
  | "INTERVENTION_ON_HOLD"
  | "INTERVENTION_RESUMED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_CLOSED";


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
