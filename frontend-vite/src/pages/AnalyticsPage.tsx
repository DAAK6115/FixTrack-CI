import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getDashboardAnalytics,
} from "../api/analytics";

import {
  BarList,
  TrendChart,
} from "../components/AnalyticsCharts";

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


export default function AnalyticsPage() {
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
          "Impossible de charger les analytics."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const maxTechnicianActivity =
    useMemo(
      () => {
        if (!data) {
          return 1;
        }

        return Math.max(
          1,
          ...data
            .technician_performance
            .map(
              (technician) =>
                Math.max(
                  technician
                    .active_assignments,
                  technician
                    .completed_interventions
                )
            )
        );
      },
      [data]
    );


  if (loading) {
    return (
      <section className="panel">
        Chargement des analytics...
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
          || "Analytics indisponibles."}
      </div>
    );
  }


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <p className="eyebrow">
            PILOTAGE
          </p>

          <h2>
            Analytics
          </h2>

          <p className="muted">
            Analyse opérationnelle des
            incidents et interventions
            de votre organisation.
          </p>
        </div>
      </section>


      <section className="analytics-stat-grid analytics-stat-grid-five">

        <article className="analytics-stat-card">
          <span>
            Incidents
          </span>

          <strong>
            {data.summary.total}
          </strong>

          <small>
            Total enregistré
          </small>
        </article>


        <article className="analytics-stat-card">
          <span>
            Ouverts
          </span>

          <strong>
            {data.summary.open}
          </strong>

          <small>
            À traiter
          </small>
        </article>


        <article className="analytics-stat-card">
          <span>
            Critiques
          </span>

          <strong>
            {
              data.summary
                .critical_open
            }
          </strong>

          <small>
            Encore ouverts
          </small>
        </article>


        <article className="analytics-stat-card">
          <span>
            Résolus
          </span>

          <strong>
            {data.summary.resolved}
          </strong>

          <small>
            Résolus ou fermés
          </small>
        </article>


        <article className="analytics-stat-card">
          <span>
            Temps moyen
          </span>

          <strong className="analytics-duration-value">
            {formatDuration(
              data.summary
                .avg_resolution_minutes
            )}
          </strong>

          <small>
            Jusqu'à résolution
          </small>
        </article>

      </section>


      <section className="analytics-dashboard-grid">

        <article className="panel analytics-wide">
          <p className="eyebrow">
            ÉVOLUTION
          </p>

          <h3>
            Signalements et résolutions
          </h3>

          <TrendChart
            points={data.trend}
          />
        </article>


        <article className="panel">
          <p className="eyebrow">
            STATUTS
          </p>

          <h3>
            État du parc d'incidents
          </h3>

          <BarList
            items={
              data.by_status
            }
          />
        </article>


        <article className="panel">
          <p className="eyebrow">
            PRIORITÉS
          </p>

          <h3>
            Niveau d'urgence
          </h3>

          <BarList
            items={
              data.by_priority
            }
          />
        </article>


        <article className="panel analytics-wide">
          <p className="eyebrow">
            CATÉGORIES
          </p>

          <h3>
            Sources principales
            d'incidents
          </h3>

          <BarList
            items={
              data.by_category
            }
            emptyLabel={
              "Aucune catégorie utilisée"
            }
          />
        </article>

      </section>


      <section className="panel">
        <div className="analytics-section-heading">
          <div>
            <p className="eyebrow">
              ÉQUIPE TECHNIQUE
            </p>

            <h3>
              Performance des techniciens
            </h3>
          </div>
        </div>


        <div className="technician-performance-table">

          <div className="technician-performance-head">
            <span>
              Technicien
            </span>

            <span>
              Actives
            </span>

            <span>
              En cours
            </span>

            <span>
              Terminées
            </span>

            <span>
              Durée moyenne
            </span>
          </div>


          {data.technician_performance.map(
            (technician) => {
              const activity =
                Math.max(
                  technician
                    .active_assignments,
                  technician
                    .completed_interventions
                );

              const width =
                Math.max(
                  5,
                  Math.round(
                    (
                      activity
                      / maxTechnicianActivity
                    )
                    * 100
                  )
                );

              return (
                <div
                  className="technician-performance-row"
                  key={technician.id}
                >
                  <div className="technician-performance-person">
                    <strong>
                      {technician.name}
                    </strong>

                    <small>
                      {technician.email}
                    </small>

                    <div className="technician-activity-track">
                      <span
                        style={{
                          width:
                            `${width}%`,
                        }}
                      />
                    </div>
                  </div>

                  <strong>
                    {
                      technician
                        .active_assignments
                    }
                  </strong>

                  <strong>
                    {
                      technician
                        .in_progress
                    }
                  </strong>

                  <strong>
                    {
                      technician
                        .completed_interventions
                    }
                  </strong>

                  <strong>
                    {formatDuration(
                      technician
                        .avg_intervention_minutes
                    )}
                  </strong>
                </div>
              );
            }
          )}


          {!data.technician_performance.length && (
            <div className="analytics-empty">
              Aucun technicien actif.
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
