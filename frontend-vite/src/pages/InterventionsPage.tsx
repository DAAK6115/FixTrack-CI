import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getIncidents,
} from "../api/incidents";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  IncidentListItem,
} from "../types/incident";


const activeStatuses = new Set([
  "ASSIGNED",
  "IN_PROGRESS",
  "ON_HOLD",
  "RESOLVED",
]);


export default function InterventionsPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [
    incidents,
    setIncidents,
  ] = useState<
    IncidentListItem[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    getIncidents()
      .then(setIncidents)
      .catch(() => {
        setError(
          "Impossible de charger les interventions."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const interventions =
    useMemo(
      () => (
        incidents.filter(
          (incident) =>
            activeStatuses.has(
              incident.status
            )
        )
      ),
      [incidents]
    );


  const assignedCount =
    interventions.filter(
      (item) =>
        item.status === "ASSIGNED"
    ).length;

  const inProgressCount =
    interventions.filter(
      (item) =>
        item.status
          === "IN_PROGRESS"
    ).length;

  const holdCount =
    interventions.filter(
      (item) =>
        item.status === "ON_HOLD"
    ).length;


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <p className="eyebrow">
            MAINTENANCE
          </p>

          <h2>
            Interventions
          </h2>

          <p className="muted">
            {
              user?.role
              === "TECHNICIAN"
              ? (
                  "Retrouvez uniquement "
                  + "les incidents qui "
                  + "vous sont assignés."
                )
              : (
                  "Suivez les interventions "
                  + "techniques de "
                  + "l'organisation."
                )
            }
          </p>
        </div>
      </section>


      <section className="workflow-stats">
        <article className="stat-card">
          <span>
            À démarrer
          </span>

          <strong>
            {assignedCount}
          </strong>
        </article>

        <article className="stat-card">
          <span>
            En cours
          </span>

          <strong>
            {inProgressCount}
          </strong>
        </article>

        <article className="stat-card">
          <span>
            En attente
          </span>

          <strong>
            {holdCount}
          </strong>
        </article>
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
        <section className="intervention-list">
          {interventions.map(
            (incident) => (
              <button
                type="button"
                className="intervention-row"
                key={incident.id}
                onClick={() =>
                  navigate(
                    `/incidents/${incident.id}`
                  )
                }
              >
                <div className="intervention-row-main">
                  <span className="incident-reference">
                    {
                      incident.reference
                    }
                  </span>

                  <strong>
                    {incident.title}
                  </strong>

                  <small>
                    📍{" "}
                    {incident.site_name}
                    {" • "}
                    {
                      incident
                        .building_name
                    }
                    {" • "}
                    {
                      incident
                        .location_name
                    }
                  </small>
                </div>

                <div className="intervention-row-assignee">
                  <span>
                    Technicien
                  </span>

                  <strong>
                    {
                      incident
                        .assigned_technician_name
                      || "Non assigné"
                    }
                  </strong>
                </div>

                <span
                  className={
                    `incident-status status-${incident.status.toLowerCase()}`
                  }
                >
                  {
                    incident
                      .status_label
                  }
                </span>

                <span className="intervention-arrow">
                  →
                </span>
              </button>
            )
          )}


          {!interventions.length && (
            <article className="panel incident-empty">
              <span>
                🛠️
              </span>

              <h3>
                Aucune intervention
              </h3>

              <p className="muted">
                Les incidents assignés
                apparaîtront ici.
              </p>
            </article>
          )}
        </section>
      )}

    </div>
  );
}
