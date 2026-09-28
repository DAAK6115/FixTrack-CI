import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getIncident,
} from "../api/incidents";

import IncidentWorkflowPanel from
  "../components/IncidentWorkflowPanel";

import type {
  IncidentDetail,
} from "../types/incident";


const priorityClasses: Record<
  string,
  string
> = {
  LOW: "priority-low",
  NORMAL: "priority-normal",
  HIGH: "priority-high",
  CRITICAL: "priority-critical",
};


export default function IncidentDetailPage() {
  const {
    id,
  } = useParams();

  const navigate = useNavigate();


  const [
    incident,
    setIncident,
  ] = useState<
    IncidentDetail | null
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
    if (!id) {
      return;
    }


    getIncident(
      Number(id)
    )
      .then(
        setIncident
      )
      .catch(() => {
        setError(
          "Impossible de charger l'incident."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);


  if (loading) {
    return (
      <div className="panel">
        Chargement...
      </div>
    );
  }


  if (
    error
    || !incident
  ) {
    return (
      <div className="error-box">
        {error
          || "Incident introuvable."}
      </div>
    );
  }


  const lastIntervention =
    incident.interventions[0]
    || null;


  return (
    <div className="page-stack">

      <section className="incident-detail-header">

        <div>
          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/incidents"
              )
            }
          >
            ← Incidents
          </button>

          <p className="eyebrow">
            {incident.reference}
          </p>

          <h2>
            {incident.title}
          </h2>


          <div className="incident-detail-badges">

            <span
              className={
                `incident-status status-${incident.status.toLowerCase()}`
              }
            >
              {incident.status_label}
            </span>


            <span
              className={
                `incident-priority ${
                  priorityClasses[
                    incident.validated_priority
                    || incident.requested_priority
                  ]
                }`
              }
            >
              {
                incident
                  .validated_priority_label
                || incident
                  .requested_priority_label
              }
            </span>

          </div>
        </div>

      </section>


      <div className="incident-detail-layout">

        <main className="incident-detail-main">

          <section className="panel">
            <p className="eyebrow">
              DESCRIPTION
            </p>

            <h3>
              Problème signalé
            </h3>

            <p className="incident-description">
              {incident.description}
            </p>
          </section>


          {!!incident.media.length && (
            <section className="panel">

              <p className="eyebrow">
                PHOTOS
              </p>

              <h3>
                Images du signalement
              </h3>


              <div className="incident-gallery">
                {incident.media.map(
                  (media) => (
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noreferrer"
                      key={media.id}
                    >
                      <img
                        src={media.url}
                        alt=""
                      />
                    </a>
                  )
                )}
              </div>

            </section>
          )}


          {lastIntervention
            && (
              <section className="panel">
                <p className="eyebrow">
                  INTERVENTION
                </p>

                <h3>
                  Compte rendu technique
                </h3>

                <div className="intervention-summary">
                  <div>
                    <span>
                      Technicien
                    </span>

                    <strong>
                      {
                        lastIntervention
                          .technician_name
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Début
                    </span>

                    <strong>
                      {new Date(
                        lastIntervention
                          .started_at
                      ).toLocaleString(
                        "fr-FR"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Fin
                    </span>

                    <strong>
                      {
                        lastIntervention
                          .ended_at
                        ? new Date(
                            lastIntervention
                              .ended_at
                          ).toLocaleString(
                            "fr-FR"
                          )
                        : "En cours"
                      }
                    </strong>
                  </div>
                </div>

                {lastIntervention
                  .resolution
                  && (
                    <div className="resolution-box">
                      <strong>
                        Résolution
                      </strong>

                      <p>
                        {
                          lastIntervention
                            .resolution
                        }
                      </p>
                    </div>
                  )}

                {lastIntervention.notes
                  && (
                    <div className="resolution-box secondary">
                      <strong>
                        Notes
                      </strong>

                      <p>
                        {
                          lastIntervention
                            .notes
                        }
                      </p>
                    </div>
                  )}
              </section>
            )}


          <section className="panel">

            <p className="eyebrow">
              HISTORIQUE
            </p>

            <h3>
              Timeline
            </h3>


            <div className="incident-timeline">
              {incident.status_history.map(
                (
                  history,
                  index
                ) => (
                  <div
                    className="timeline-entry"
                    key={history.id}
                  >
                    <div className="timeline-marker">
                      <span />

                      {index
                        < incident
                          .status_history
                          .length - 1
                        && <i />}
                    </div>


                    <div className="timeline-content">

                      <strong>
                        {
                          history.new_status_label
                        }
                      </strong>

                      <p>
                        {history.comment
                          || "Statut modifié."}
                      </p>

                      <small>
                        {
                          history.changed_by_name
                        }
                        {" • "}
                        {new Date(
                          history.created_at
                        ).toLocaleString(
                          "fr-FR"
                        )}
                      </small>

                    </div>
                  </div>
                )
              )}
            </div>

          </section>

        </main>


        <aside className="incident-detail-sidebar">

          <IncidentWorkflowPanel
            incident={incident}
            onUpdated={
              setIncident
            }
          />


          <section className="panel">
            <p className="eyebrow">
              INFORMATIONS
            </p>


            <div className="incident-info-list">

              <div>
                <span>
                  Catégorie
                </span>

                <strong>
                  {
                    incident
                      .category_detail
                      .icon
                  }{" "}
                  {
                    incident
                      .category_detail
                      .name
                  }
                </strong>
              </div>


              <div>
                <span>
                  Priorité demandée
                </span>

                <strong>
                  {
                    incident
                      .requested_priority_label
                  }
                </strong>
              </div>


              <div>
                <span>
                  Priorité confirmée
                </span>

                <strong>
                  {
                    incident
                      .validated_priority_label
                    || "Pas encore validée"
                  }
                </strong>
              </div>


              <div>
                <span>
                  Signalé par
                </span>

                <strong>
                  {
                    incident
                      .reported_by
                      .name
                  }
                </strong>

                <small>
                  {
                    incident
                      .reported_by
                      .email
                  }
                </small>
              </div>


              <div>
                <span>
                  Signalé le
                </span>

                <strong>
                  {new Date(
                    incident.reported_at
                  ).toLocaleString(
                    "fr-FR"
                  )}
                </strong>
              </div>

            </div>

          </section>


          <section className="panel">
            <p className="eyebrow">
              EMPLACEMENT
            </p>


            <div className="incident-location-detail">

              <strong>
                📍{" "}
                {
                  incident
                    .location_detail
                    .site
                    .name
                }
              </strong>

              <span>
                {
                  incident
                    .location_detail
                    .building
                    .name
                }
              </span>

              <span>
                {
                  incident
                    .location_detail
                    .floor
                    .name
                }
              </span>

              <span>
                {
                  incident
                    .location_detail
                    .name
                }

                {incident
                  .location_detail
                  .code
                  ? ` (${incident.location_detail.code})`
                  : ""}
              </span>

            </div>

          </section>


          {!!incident.assignments.length && (
            <section className="panel">
              <p className="eyebrow">
                ASSIGNATIONS
              </p>

              <div className="assignment-history">
                {incident.assignments.map(
                  (assignment) => (
                    <div
                      key={assignment.id}
                      className="assignment-history-row"
                    >
                      <strong>
                        {
                          assignment
                            .technician_name
                        }
                      </strong>

                      <span>
                        {new Date(
                          assignment
                            .assigned_at
                        ).toLocaleString(
                          "fr-FR"
                        )}
                      </span>

                      <small>
                        {
                          assignment.is_active
                          ? "Assignation active"
                          : "Ancienne assignation"
                        }
                      </small>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

        </aside>

      </div>

    </div>
  );
}
