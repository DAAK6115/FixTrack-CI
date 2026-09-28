import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  assignIncident,
  closeIncident,
  holdIncident,
  rejectIncident,
  resolveIncident,
  resumeIncident,
  startIncident,
  validateIncident,
} from "../api/incidents";

import {
  getTechnicians,
} from "../api/users";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  IncidentDetail,
  IncidentPriority,
} from "../types/incident";

import type {
  ManagedUser,
} from "../types/user";


type Props = {
  incident: IncidentDetail;

  onUpdated: (
    incident: IncidentDetail
  ) => void;
};


const priorityLabels:
  Record<
    IncidentPriority,
    string
  > = {
    LOW: "Faible",
    NORMAL: "Normale",
    HIGH: "Haute",
    CRITICAL: "Critique",
  };


export default function IncidentWorkflowPanel({
  incident,
  onUpdated,
}: Props) {
  const {
    user,
  } = useAuth();


  const [
    technicians,
    setTechnicians,
  ] = useState<
    ManagedUser[]
  >([]);

  const [
    technicianId,
    setTechnicianId,
  ] = useState("");

  const [
    validatedPriority,
    setValidatedPriority,
  ] = useState<IncidentPriority>(
    incident.validated_priority
    || incident.requested_priority
  );

  const [
    comment,
    setComment,
  ] = useState("");

  const [
    resolution,
    setResolution,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  const isManager =
    user?.role === "ADMIN"
    || user?.role === "MANAGER";


  const isAssignedTechnician =
    user?.role === "TECHNICIAN"
    && incident.active_assignment
      ?.technician === user.id;


  const canOperate =
    isManager
    || isAssignedTechnician;


  const canClose =
    incident.status === "RESOLVED"
    && (
      isManager
      || incident.reported_by.id
        === user?.id
    );


  useEffect(() => {
    if (!isManager) {
      return;
    }

    getTechnicians()
      .then(
        (data) => {
          setTechnicians(data);

          if (
            incident
              .active_assignment
              ?.technician
          ) {
            setTechnicianId(
              String(
                incident
                  .active_assignment
                  .technician
              )
            );
          }
        }
      )
      .catch(() => {
        setError(
          "Impossible de charger les techniciens."
        );
      });
  }, [
    isManager,
    incident.active_assignment,
  ]);


  const hasAction =
    useMemo(
      () => {
        if (
          isManager
          && incident.status
            === "REPORTED"
        ) {
          return true;
        }

        if (
          isManager
          && [
            "REPORTED",
            "VALIDATED",
            "ASSIGNED",
            "ON_HOLD",
          ].includes(
            incident.status
          )
        ) {
          return true;
        }

        if (
          canOperate
          && [
            "ASSIGNED",
            "IN_PROGRESS",
            "ON_HOLD",
          ].includes(
            incident.status
          )
        ) {
          return true;
        }

        return canClose;
      },
      [
        isManager,
        canOperate,
        canClose,
        incident.status,
      ]
    );


  async function execute(
    operation:
      () => Promise<IncidentDetail>
  ) {
    setLoading(true);
    setError("");

    try {
      const updated =
        await operation();

      onUpdated(updated);

      setComment("");
      setResolution("");
      setNotes("");
    } catch (
      exception: unknown
    ) {
      const responseMessage =
        (
          exception as {
            response?: {
              data?: {
                detail?: string;
              };
            };
          }
        )
          .response
          ?.data
          ?.detail;

      setError(
        responseMessage
        || "L'action n'a pas pu être exécutée."
      );
    } finally {
      setLoading(false);
    }
  }


  const submitAssign = (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!technicianId) {
      setError(
        "Sélectionnez un technicien."
      );

      return;
    }

    void execute(
      () => assignIncident(
        incident.id,
        Number(technicianId),
        comment
      )
    );
  };


  if (!hasAction) {
    return (
      <section className="panel workflow-panel">
        <p className="eyebrow">
          WORKFLOW
        </p>

        <h3>
          Suivi de l'intervention
        </h3>

        <p className="muted">
          Aucune action n'est disponible
          pour votre rôle à cette étape.
        </p>

        {incident.active_assignment && (
          <div className="workflow-assignee">
            <span>
              Technicien actuel
            </span>

            <strong>
              {
                incident
                  .active_assignment
                  .technician_name
              }
            </strong>
          </div>
        )}
      </section>
    );
  }


  return (
    <section className="panel workflow-panel">
      <p className="eyebrow">
        WORKFLOW
      </p>

      <h3>
        Actions disponibles
      </h3>

      <p className="muted">
        Le backend contrôle chaque
        transition : une étape ne peut
        pas être sautée.
      </p>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {incident.active_assignment && (
        <div className="workflow-assignee">
          <span>
            Technicien assigné
          </span>

          <strong>
            {
              incident
                .active_assignment
                .technician_name
            }
          </strong>

          <small>
            {
              incident
                .active_assignment
                .technician_email
            }
          </small>
        </div>
      )}


      {isManager
        && incident.status
          === "REPORTED"
        && (
          <div className="workflow-block">
            <label className="field">
              Priorité confirmée

              <select
                value={
                  validatedPriority
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (
                    value === "LOW"
                    || value === "NORMAL"
                    || value === "HIGH"
                    || value === "CRITICAL"
                  ) {
                    setValidatedPriority(
                      value
                    );
                  }
                }}
              >
                {Object.entries(
                  priorityLabels
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="field">
              Commentaire

              <textarea
                rows={3}
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Optionnel"
              />
            </label>

            <div className="workflow-actions">
              <button
                type="button"
                className="primary-button"
                disabled={loading}
                onClick={() =>
                  void execute(
                    () =>
                      validateIncident(
                        incident.id,
                        {
                          validated_priority:
                            validatedPriority,
                          comment,
                        }
                      )
                  )
                }
              >
                Valider l'incident
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={loading}
                onClick={() =>
                  void execute(
                    () =>
                      rejectIncident(
                        incident.id,
                        comment
                      )
                  )
                }
              >
                Rejeter
              </button>
            </div>
          </div>
        )}


      {isManager
        && [
          "REPORTED",
          "VALIDATED",
          "ASSIGNED",
          "ON_HOLD",
        ].includes(
          incident.status
        )
        && (
          <form
            className="workflow-block"
            onSubmit={submitAssign}
          >
            <label className="field">
              Technicien

              <select
                value={technicianId}
                onChange={(event) =>
                  setTechnicianId(
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Choisir un technicien
                </option>

                {technicians.map(
                  (technician) => (
                    <option
                      key={
                        technician.id
                      }
                      value={
                        technician.id
                      }
                    >
                      {
                        technician
                          .full_name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="field">
              Note d'assignation

              <textarea
                rows={2}
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Optionnel"
              />
            </label>

            <button
              className="secondary-button"
              disabled={
                loading
                || !technicianId
              }
            >
              {
                incident
                  .active_assignment
                ? "Réassigner"
                : "Assigner"
              }
            </button>
          </form>
        )}


      {canOperate
        && incident.status
          === "ASSIGNED"
        && (
          <div className="workflow-block">
            <label className="field">
              Note de démarrage

              <textarea
                rows={2}
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Optionnel"
              />
            </label>

            <button
              type="button"
              className="primary-button"
              disabled={loading}
              onClick={() =>
                void execute(
                  () =>
                    startIncident(
                      incident.id,
                      comment
                    )
                )
              }
            >
              Démarrer l'intervention
            </button>
          </div>
        )}


      {canOperate
        && incident.status
          === "IN_PROGRESS"
        && (
          <div className="workflow-block">
            <label className="field">
              Note / motif

              <textarea
                rows={2}
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Utilisé pour la mise en attente"
              />
            </label>

            <button
              type="button"
              className="secondary-button"
              disabled={loading}
              onClick={() =>
                void execute(
                  () =>
                    holdIncident(
                      incident.id,
                      comment
                    )
                )
              }
            >
              Mettre en pause
            </button>

            <div className="workflow-resolution">
              <label className="field">
                Compte rendu de résolution *

                <textarea
                  rows={4}
                  value={resolution}
                  onChange={(event) =>
                    setResolution(
                      event.target.value
                    )
                  }
                  placeholder="Décrivez précisément ce qui a été réparé..."
                />
              </label>

              <label className="field">
                Notes internes

                <textarea
                  rows={3}
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  placeholder="Optionnel"
                />
              </label>

              <button
                type="button"
                className="primary-button"
                disabled={
                  loading
                  || !resolution.trim()
                }
                onClick={() =>
                  void execute(
                    () =>
                      resolveIncident(
                        incident.id,
                        {
                          resolution,
                          notes,
                        }
                      )
                  )
                }
              >
                Terminer l'intervention
              </button>
            </div>
          </div>
        )}


      {canOperate
        && incident.status
          === "ON_HOLD"
        && (
          <div className="workflow-block">
            <label className="field">
              Note de reprise

              <textarea
                rows={2}
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Optionnel"
              />
            </label>

            <button
              type="button"
              className="primary-button"
              disabled={loading}
              onClick={() =>
                void execute(
                  () =>
                    resumeIncident(
                      incident.id,
                      comment
                    )
                )
              }
            >
              Reprendre l'intervention
            </button>
          </div>
        )}


      {canClose && (
        <div className="workflow-block">
          <label className="field">
            Confirmation

            <textarea
              rows={2}
              value={comment}
              onChange={(event) =>
                setComment(
                  event.target.value
                )
              }
              placeholder="Optionnel"
            />
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={loading}
            onClick={() =>
              void execute(
                () =>
                  closeIncident(
                    incident.id,
                    comment
                  )
              )
            }
          >
            Confirmer et fermer
          </button>
        </div>
      )}


      {loading && (
        <div className="workflow-loading">
          Mise à jour du workflow...
        </div>
      )}
    </section>
  );
}
