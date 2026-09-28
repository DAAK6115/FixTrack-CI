import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getDashboardAnalytics,
} from "../api/analytics";

import {
  BarList,
  TrendChart,
} from "../components/AnalyticsCharts";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  DashboardAnalytics,
} from "../types/analytics";


function formatDuration(
  minutes: number
) {
  if (!minutes) {
    return "0 min";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    Math.round(
      minutes % 60
    );

  return remaining
    ? `${hours} h ${remaining} min`
    : `${hours} h`;
}


export default function DashboardPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [
    data,
    setData,
  ] = useState<
    DashboardAnalytics | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    getDashboardAnalytics()
      .then(setData)
      .catch(() => {
        setError(
          "Impossible de charger le tableau de bord."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const cards = useMemo(
    () => {
      if (!data) {
        return [];
      }

      if (
        data.role
        === "TECHNICIAN"
      ) {
        return [
          {
            label:
              "À démarrer",
            value:
              data.summary.assigned,
            detail:
              "Interventions assignées",
          },
          {
            label:
              "En cours",
            value:
              data.summary.in_progress,
            detail:
              "Interventions actives",
          },
          {
            label:
              "En pause",
            value:
              data.summary.on_hold,
            detail:
              "En attente de reprise",
          },
          {
            label:
              "Durée moyenne",
            value:
              formatDuration(
                data.summary
                  .avg_intervention_minutes
              ),
            detail:
              "Interventions terminées",
          },
        ];
      }


      if (
        data.role
        === "REQUESTER"
      ) {
        return [
          {
            label:
              "Mes signalements",
            value:
              data.summary.total,
            detail:
              "Total créé",
          },
          {
            label:
              "Ouverts",
            value:
              data.summary.open,
            detail:
              "Encore à traiter",
          },
          {
            label:
              "Résolus",
            value:
              data.summary.resolved,
            detail:
              "Résolution enregistrée",
          },
          {
            label:
              "Fermés",
            value:
              data.summary.closed,
            detail:
              "Dossiers terminés",
          },
        ];
      }


      return [
        {
          label:
            "Incidents ouverts",
          value:
            data.summary.open,
          detail:
            "À surveiller",
        },
        {
          label:
            "Critiques",
          value:
            data.summary
              .critical_open,
          detail:
            "Priorité critique",
        },
        {
          label:
            "En cours",
          value:
            data.summary
              .in_progress,
          detail:
            "Interventions actives",
        },
        {
          label:
            "Temps moyen",
          value:
            formatDuration(
              data.summary
                .avg_resolution_minutes
            ),
          detail:
            "Signalement → résolution",
        },
      ];
    },
    [data]
  );


  if (loading) {
    return (
      <section className="panel">
        Chargement du tableau de bord...
      </section>
    );
  }


  if (
    error
    || !data
  ) {
    return (
      <div className="error-box">
        {error
          || "Données indisponibles."}
      </div>
    );
  }


  const managerView =
    data.role === "ADMIN"
    || data.role === "MANAGER";


  return (
    <div className="page-stack">

      <section className="hero-card dashboard-hero">
        <div>
          <p className="eyebrow">
            VUE OPÉRATIONNELLE
          </p>

          <h2>
            {
              data.role
              === "TECHNICIAN"
                ? "Mes interventions"
                : data.role
                  === "REQUESTER"
                    ? "Mes signalements"
                    : "Tableau de bord"
            }
          </h2>

          <p className="muted">
            Les indicateurs sont calculés
            à partir des données réelles
            de FixTrack CI.
          </p>
        </div>


        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate(
                "/incidents/new"
              )
            }
          >
            + Signaler un incident
          </button>

          {managerView && (
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/analytics"
                )
              }
            >
              Voir les analytics
            </button>
          )}
        </div>
      </section>


      <section className="analytics-stat-grid">
        {cards.map(
          (card) => (
            <article
              className="analytics-stat-card"
              key={card.label}
            >
              <span>
                {card.label}
              </span>

              <strong>
                {card.value}
              </strong>

              <small>
                {card.detail}
              </small>
            </article>
          )
        )}
      </section>


      <section className="analytics-dashboard-grid">

        <article className="panel analytics-wide">
          <div className="analytics-section-heading">
            <div>
              <p className="eyebrow">
                7 DERNIERS JOURS
              </p>

              <h3>
                Activité des incidents
              </h3>
            </div>
          </div>

          <TrendChart
            points={data.trend}
          />
        </article>


        <article className="panel">
          <div className="analytics-section-heading">
            <div>
              <p className="eyebrow">
                STATUTS
              </p>

              <h3>
                Répartition
              </h3>
            </div>
          </div>

          <BarList
            items={
              data.by_status
            }
          />
        </article>


        <article className="panel">
          <div className="analytics-section-heading">
            <div>
              <p className="eyebrow">
                PRIORITÉS
              </p>

              <h3>
                Niveau d'urgence
              </h3>
            </div>
          </div>

          <BarList
            items={
              data.by_priority
            }
          />
        </article>

      </section>


      <section className="panel">
        <div className="analytics-section-heading analytics-heading-row">
          <div>
            <p className="eyebrow">
              RÉCENTS
            </p>

            <h3>
              Derniers incidents
            </h3>
          </div>

          <button
            type="button"
            className="notification-text-button"
            onClick={() =>
              navigate(
                "/incidents"
              )
            }
          >
            Voir tous
          </button>
        </div>


        <div className="analytics-recent-list">
          {data.recent_incidents.map(
            (incident) => (
              <button
                key={incident.id}
                type="button"
                className="analytics-recent-row"
                onClick={() =>
                  navigate(
                    `/incidents/${incident.id}`
                  )
                }
              >
                <div>
                  <span className="incident-reference">
                    {
                      incident.reference
                    }
                  </span>

                  <strong>
                    {incident.title}
                  </strong>

                  <small>
                    {
                      incident.site
                    }
                    {" • "}
                    {
                      incident.location
                    }
                  </small>
                </div>

                <span
                  className={
                    `incident-status status-${incident.status.toLowerCase()}`
                  }
                >
                  {
                    incident.status_label
                  }
                </span>

                <span className="analytics-row-arrow">
                  →
                </span>
              </button>
            )
          )}


          {!data.recent_incidents.length && (
            <div className="analytics-empty">
              Aucun incident à afficher.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
