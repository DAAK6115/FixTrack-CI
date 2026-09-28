import type {
  IncidentPriority,
  IncidentStatus,
} from "./incident";


export type AnalyticsSummary = {
  total: number;
  open: number;
  reported: number;
  assigned: number;
  in_progress: number;
  on_hold: number;
  resolved: number;
  closed: number;
  critical_open: number;

  avg_resolution_minutes:
    number;

  avg_intervention_minutes:
    number;
};


export type AnalyticsBreakdown = {
  key: string;
  label: string;
  count: number;
};


export type AnalyticsCategory = {
  label: string;
  count: number;
};


export type AnalyticsTrendPoint = {
  date: string;
  label: string;
  reported: number;
  resolved: number;
};


export type AnalyticsIncident = {
  id: number;
  reference: string;
  title: string;

  status: IncidentStatus;
  status_label: string;

  priority: IncidentPriority;
  priority_label: string;

  category: string;
  site: string;
  location: string;

  reported_at: string;
  resolved_at: string | null;
};


export type TechnicianPerformance = {
  id: number;
  name: string;
  email: string;

  active_assignments: number;
  in_progress: number;
  on_hold: number;

  completed_interventions:
    number;

  avg_intervention_minutes:
    number;
};


export type DashboardAnalytics = {
  role:
    | "ADMIN"
    | "MANAGER"
    | "TECHNICIAN"
    | "REQUESTER";

  summary: AnalyticsSummary;

  by_status:
    AnalyticsBreakdown[];

  by_priority:
    AnalyticsBreakdown[];

  by_category:
    AnalyticsCategory[];

  trend:
    AnalyticsTrendPoint[];

  recent_incidents:
    AnalyticsIncident[];

  technician_performance:
    TechnicianPerformance[];
};
