import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

import type {
  FixTrackNotification,
} from "../types/notification";


export default function NotificationsPage() {
  const navigate = useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState<
    FixTrackNotification[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const load = async () => {
    setLoading(true);
    setError("");

    try {
      setNotifications(
        await getNotifications()
      );
    } catch {
      setError(
        "Impossible de charger les notifications."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();
  }, []);


  const openNotification =
    async (
      notification:
        FixTrackNotification
    ) => {
      if (
        !notification.is_read
      ) {
        try {
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
        } catch {
          // La navigation reste possible.
        }
      }

      if (
        notification.incident
      ) {
        navigate(
          `/incidents/${notification.incident}`
        );
      }
    };


  const markEverythingRead =
    async () => {
      try {
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
      } catch {
        setError(
          "Impossible de mettre à jour les notifications."
        );
      }
    };


  return (
    <div className="page-stack">

      <section className="hero-card notification-page-hero">
        <div>
          <p className="eyebrow">
            ACTIVITÉ
          </p>

          <h2>
            Notifications
          </h2>

          <p className="muted">
            Suivez les changements
            importants de vos incidents
            et interventions.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            void markEverythingRead()
          }
        >
          Tout marquer comme lu
        </button>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {loading ? (
        <section className="panel">
          Chargement...
        </section>
      ) : (
        <section className="notification-page-list">

          {notifications.map(
            (notification) => (
              <button
                type="button"
                key={notification.id}
                className={
                  notification.is_read
                    ? "notification-page-row"
                    : (
                        "notification-page-row "
                        + "unread"
                      )
                }
                onClick={() =>
                  void openNotification(
                    notification
                  )
                }
              >
                <span className="notification-page-icon">
                  🔔
                </span>

                <div className="notification-page-content">
                  <div>
                    <strong>
                      {
                        notification.title
                      }
                    </strong>

                    {!notification.is_read && (
                      <span className="notification-new-badge">
                        Nouveau
                      </span>
                    )}
                  </div>

                  <p>
                    {
                      notification.message
                    }
                  </p>

                  <small>
                    {
                      notification
                        .incident_reference
                        ? (
                            `${notification.incident_reference} • `
                          )
                        : ""
                    }

                    {new Date(
                      notification.created_at
                    ).toLocaleString(
                      "fr-FR"
                    )}
                  </small>
                </div>

                <span className="notification-page-arrow">
                  →
                </span>
              </button>
            )
          )}


          {!notifications.length && (
            <article className="panel notification-empty-page">
              <span>
                🔕
              </span>

              <h3>
                Aucune notification
              </h3>

              <p className="muted">
                Vous êtes à jour.
              </p>
            </article>
          )}

        </section>
      )}

    </div>
  );
}
