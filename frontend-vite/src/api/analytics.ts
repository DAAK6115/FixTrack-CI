import api from "./client";

import type {
  DashboardAnalytics,
} from "../types/analytics";


export async function getDashboardAnalytics() {
  const { data } = await api.get<
    DashboardAnalytics
  >(
    "/analytics/dashboard/"
  );

  return data;
}
