import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  FixTrackNotification,
} from "../types/notification";


function websocketUrl(
  token: string
) {
  const apiUrl =
    import.meta.env.VITE_API_URL
    ?? "http://127.0.0.1:8000/api/v1";

  const baseUrl = apiUrl
    .replace(
      /^http/,
      "ws"
    )
    .replace(
      /\/api\/v1\/?$/,
      ""
    );

  return (
    `${baseUrl}/ws/notifications/`
    + `?token=${encodeURIComponent(token)}`
  );
}



function notificationDestination(
  notification:
    FixTrackNotification
) {
  if (
    notification.incident
  ) {
    return (
      `/incidents/${notification.incident}`
    );
  }

  if (
    notification.notification_type
    === "EQUIPMENT_DELETION_REQUESTED"
  ) {
    return (
      "/equipment/deletion-requests"
    );
  }

  if (
    notification.notification_type
    === "EQUIPMENT_DELETION_APPROVED"
    || notification.notification_type
    === "EQUIPMENT_DELETION_REJECTED"
  ) {
    return "/equipment";
  }

  return "/notifications";
}


export default function NotificationBell() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState<
    FixTrackNotification[]
  >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const reconnectTimer =
    useRef<
      ReturnType<typeof setTimeout>
      | null
    >(null);

  const knownNotificationIds =
    useRef<
      Set<number>
    >(
      new Set()
    );

  const initializedNotifications =
    useRef(false);


  const loadData =
    useCallback(
      async () => {
        if (!user) {
          return;
        }

        try {
          const [
            list,
            count,
          ] = await Promise.all([
            getNotifications(),
            getUnreadCount(),
          ]);

          const latest =
            list.slice(
              0,
              8
            );

          if (
            initializedNotifications.current
          ) {
            for (
              const notification
              of latest
            ) {
              if (
                !knownNotificationIds
                  .current
                  .has(
                    notification.id
                  )
              ) {
                knownNotificationIds
                  .current
                  .add(
                    notification.id
                  );

                window.dispatchEvent(
                  new CustomEvent(
                    "fixtrack:notification",
                    {
                      detail:
                        notification,
                    }
                  )
                );
              }
            }
          } else {
            for (
              const notification
              of latest
            ) {
              knownNotificationIds
                .current
                .add(
                  notification.id
                );
            }

            initializedNotifications
              .current = true;
          }

          setNotifications(
            latest
          );

          setUnreadCount(
            count
          );
        } catch {
          // Le prochain polling réessaiera.
        }
      },
      [user]
    );



  useEffect(() => {
    void loadData();
  }, [loadData]);


  useEffect(() => {
    if (!user) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          void loadData();
        },
        5000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    loadData,
    user,
  ]);


  useEffect(() => {
    if (!user) {
      return;
    }

    let socket:
      WebSocket | null = null;

    let disposed = false;

    let failedConnections = 0;


    const connect = () => {
      const token =
        localStorage.getItem(
          "fixtrack_access_token"
        );

      if (
        !token
        || disposed
      ) {
        return;
      }

      socket = new WebSocket(
        websocketUrl(
          token
        )
      );


      socket.onopen = () => {
        failedConnections = 0;
      };


      socket.onmessage = (
        event
      ) => {
        try {
          const payload =
            JSON.parse(
              event.data
            );

          if (
            payload.type
            !== "notification"
            || !payload.notification
          ) {
            return;
          }

          const notification =
            payload.notification;

          if (
            !notification
            || typeof notification !== "object"
            || typeof notification.id !== "number"
            || typeof notification.title !== "string"
            || typeof notification.message !== "string"
            || typeof notification.is_read !== "boolean"
          ) {
            return;
          }

          const alreadyKnown =
            knownNotificationIds
              .current
              .has(
                notification.id
              );

          knownNotificationIds
            .current
            .add(
              notification.id
            );

          setNotifications(
            (current) => {
              const withoutDuplicate =
                current.filter(
                  (item) =>
                    item.id
                    !== notification.id
                );

              return [
                notification,
                ...withoutDuplicate,
              ].slice(
                0,
                8
              );
            }
          );

          if (
            !alreadyKnown
            && !notification.is_read
          ) {
            setUnreadCount(
              (current) =>
                current + 1
            );
          }

          if (!alreadyKnown) {
            window.dispatchEvent(
              new CustomEvent(
                "fixtrack:notification",
                {
                  detail:
                    notification,
                }
              )
            );
          }
        } catch {
          // Message WebSocket invalide :
          // on l'ignore.
        }
      };


      socket.onclose = () => {
        if (disposed) {
          return;
        }

        failedConnections += 1;

        if (
          failedConnections
          > 3
        ) {
          return;
        }

        reconnectTimer.current =
          setTimeout(
            connect,
            3000
          );
      };
    };


    connect();


    return () => {
      disposed = true;

      if (
        reconnectTimer.current
      ) {
        clearTimeout(
          reconnectTimer.current
        );
      }

      socket?.close();
    };
  }, [user]);


  const openNotification =
    async (
      notification:
        FixTrackNotification
    ) => {
      try {
        if (
          !notification.is_read
        ) {
          await markNotificationRead(
            notification.id
          );

          setNotifications(
            (current) =>
              current.map(
                (item) =>
                  item.id
                  === notification.id
                    ? {
                        ...item,
                        is_read: true,
                      }
                    : item
              )
          );

          setUnreadCount(
            (current) =>
              Math.max(
                current - 1,
                0
              )
          );
        }
      } finally {
        setOpen(false);

        navigate(
          notificationDestination(
            notification
          )
        );
      }
    };


  const markEverythingRead =
    async () => {
      await (
        markAllNotificationsRead()
      );

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              is_read: true,
            })
          )
      );

      setUnreadCount(0);
    };


  if (!user) {
    return null;
  }


  return (
    <div className="notification-center">

      <button
        type="button"
        className="notification-bell"
        onClick={() =>
          setOpen(
            (current) =>
              !current
          )
        }
        aria-label="Notifications"
      >
        <span>
          🔔
        </span>

        {unreadCount > 0 && (
          <strong>
            {
              unreadCount > 99
                ? "99+"
                : unreadCount
            }
          </strong>
        )}
      </button>


      {open && (
        <div className="notification-popover">

          <div className="notification-popover-header">
            <div>
              <p className="eyebrow">
                NOTIFICATIONS
              </p>

              <h3>
                Centre d'activité
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-text-button"
                onClick={() =>
                  void markEverythingRead()
                }
              >
                Tout lire
              </button>
            )}
          </div>


          <div className="notification-popover-list">

            {notifications.map(
              (notification) => (
                <button
                  type="button"
                  key={
                    notification.id
                  }
                  className={
                    notification.is_read
                      ? "notification-item"
                      : (
                          "notification-item "
                          + "unread"
                        )
                  }
                  onClick={() =>
                    void openNotification(
                      notification
                    )
                  }
                >
                  <span className="notification-item-dot" />

                  <div>
                    <strong>
                      {
                        notification.title
                      }
                    </strong>

                    <p>
                      {
                        notification.message
                      }
                    </p>

                    <small>
                      {new Date(
                        notification.created_at
                      ).toLocaleString(
                        "fr-FR"
                      )}
                    </small>
                  </div>
                </button>
              )
            )}


            {!notifications.length && (
              <div className="notification-empty">
                <span>
                  🔕
                </span>

                <strong>
                  Aucune notification
                </strong>

                <p>
                  Les nouveaux événements
                  apparaîtront ici.
                </p>
              </div>
            )}

          </div>


          <button
            type="button"
            className="notification-view-all"
            onClick={() => {
              setOpen(false);

              navigate(
                "/notifications"
              );
            }}
          >
            Voir toutes les notifications
          </button>

        </div>
      )}

    </div>
  );
}
