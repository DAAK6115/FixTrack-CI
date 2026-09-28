import api from "./client";

import type {
  FixTrackNotification,
} from "../types/notification";


export async function getNotifications(
  isRead?: boolean
) {
  const { data } = await api.get<
    FixTrackNotification[]
  >(
    "/notifications/",
    {
      params:
        typeof isRead
        === "boolean"
          ? {
              is_read:
                String(isRead),
            }
          : undefined,
    }
  );

  return data;
}


export async function getUnreadCount() {
  const { data } = await api.get<{
    count: number;
  }>(
    "/notifications/unread-count/"
  );

  return data.count;
}


export async function markNotificationRead(
  id: number
) {
  const { data } = await api.post<
    FixTrackNotification
  >(
    `/notifications/${id}/mark-read/`
  );

  return data;
}


export async function markAllNotificationsRead() {
  const { data } = await api.post<{
    updated: number;
  }>(
    "/notifications/mark-all-read/"
  );

  return data;
}
