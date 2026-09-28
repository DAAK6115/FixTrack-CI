import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  approveEquipmentDeletion,
  getEquipmentDeletionRequests,
  rejectEquipmentDeletion,
} from "../api/equipment";

import type {
  EquipmentDeletionRequest,
} from "../types/equipment";


export default function EquipmentDeletionRequestsPage() {
  const [
    requests,
    setRequests,
  ] = useState<
    EquipmentDeletionRequest[]
  >([]);

  const [
    selected,
    setSelected,
  ] = useState<
    EquipmentDeletionRequest
    | null
  >(null);

  const [
    mode,
    setMode,
  ] = useState<
    "approve"
    | "reject"
    | null
  >(null);

  const [
    reviewNote,
    setReviewNote,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  const load = async () => {
    setLoading(true);
    setError("");

    try {
      setRequests(
        await getEquipmentDeletionRequests()
      );
    } catch {
      setError(
        "Impossible de charger les demandes de suppression."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();
  }, []);


  const pending = useMemo(
    () => (
      requests.filter(
        (request) =>
          request.status
          === "PENDING"
      )
    ),
    [requests]
  );


  const history = useMemo(
    () => (
      requests.filter(
        (request) =>
          request.status
          !== "PENDING"
      )
    ),
    [requests]
  );


  const submitReview = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !selected
      || !mode
    ) {
      return;
    }

    if (
      mode === "reject"
      && reviewNote
        .trim()
        .length
      < 3
    ) {
      setError(
        "Indiquez la raison du refus."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      if (
        mode
        === "approve"
      ) {
        await approveEquipmentDeletion(
          selected.id,
          reviewNote.trim()
        );
      } else {
        await rejectEquipmentDeletion(
          selected.id,
          reviewNote.trim()
        );
      }

      setSelected(null);
      setMode(null);
      setReviewNote("");

      await load();
    } catch {
      setError(
        "Impossible de traiter cette demande."
      );
    } finally {
      setSaving(false);
    }
  };


  const openReview = (
    request:
      EquipmentDeletionRequest,
    nextMode:
      "approve"
      | "reject"
  ) => {
    setSelected(
      request
    );

    setMode(
      nextMode
    );

    setReviewNote("");
    setError("");
  };


  return (
    <div className="page-stack">

      <section className="hero-card equipment-hero">
        <div>
          <p className="eyebrow">
            ADMINISTRATION
          </p>

          <h2>
            Suppressions d'équipements
          </h2>

          <p className="muted">
            Validez ou refusez les demandes,
            et consultez les justificatifs
            conservés dans l'historique.
          </p>
        </div>

        <div className="equipment-deletion-count">
          <strong>
            {pending.length}
          </strong>

          <span>
            en attente
          </span>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {selected
        && mode
        && (
          <form
            className="panel equipment-review-panel"
            onSubmit={submitReview}
          >
            <div>
              <p className="eyebrow">
                {
                  mode === "approve"
                    ? "VALIDATION"
                    : "REFUS"
                }
              </p>

              <h3>
                {
                  selected
                    .equipment_code
                }
                {" — "}
                {
                  selected
                    .equipment_name
                }
              </h3>
            </div>


            <div className="equipment-request-justification">
              <span>
                Justification du demandeur
              </span>

              <p>
                {
                  selected
                    .justification
                }
              </p>

              <small>
                Par{" "}
                {
                  selected
                    .requested_by_name
                  || selected
                    .requested_by_email
                }
              </small>
            </div>


            <label className="field">
              {
                mode === "reject"
                  ? "Motif du refus *"
                  : "Note de validation"
              }

              <textarea
                rows={4}
                value={
                  reviewNote
                }
                onChange={(event) =>
                  setReviewNote(
                    event.target.value
                  )
                }
                placeholder={
                  mode === "reject"
                    ? "Expliquez pourquoi la suppression est refusée..."
                    : "Ex. Équipement vérifié et retrait autorisé..."
                }
              />
            </label>


            <div className="equipment-delete-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelected(
                    null
                  );

                  setMode(
                    null
                  );
                }}
              >
                Annuler
              </button>

              <button
                type="submit"
                className={
                  mode === "approve"
                    ? "equipment-danger-button"
                    : "secondary-button"
                }
                disabled={saving}
              >
                {
                  saving
                    ? "Traitement..."
                    : (
                        mode === "approve"
                          ? "Valider la suppression"
                          : "Refuser la demande"
                      )
                }
              </button>
            </div>
          </form>
        )}


      <section className="panel">
        <div className="analytics-section-heading">
          <div>
            <p className="eyebrow">
              À TRAITER
            </p>

            <h3>
              Demandes en attente
            </h3>
          </div>
        </div>


        {loading ? (
          <div className="analytics-empty">
            Chargement...
          </div>
        ) : (
          <div className="equipment-deletion-list">

            {pending.map(
              (request) => (
                <article
                  className="equipment-deletion-card"
                  key={request.id}
                >
                  <div className="equipment-deletion-media">
                    {request.equipment_image_url ? (
                      <img
                        src={
                          request
                            .equipment_image_url
                        }
                        alt={
                          request
                            .equipment_name
                        }
                      />
                    ) : (
                      <span>
                        🧰
                      </span>
                    )}
                  </div>

                  <div className="equipment-deletion-content">
                    <span className="incident-reference">
                      {
                        request
                          .equipment_code
                      }
                    </span>

                    <h3>
                      {
                        request
                          .equipment_name
                      }
                    </h3>

                    <p>
                      {
                        request
                          .justification
                      }
                    </p>

                    <small>
                      Demandée par{" "}
                      {
                        request
                          .requested_by_name
                        || request
                          .requested_by_email
                      }
                      {" • "}
                      {new Date(
                        request
                          .requested_at
                      ).toLocaleString(
                        "fr-FR"
                      )}
                    </small>
                  </div>

                  <div className="equipment-deletion-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        openReview(
                          request,
                          "reject"
                        )
                      }
                    >
                      Refuser
                    </button>

                    <button
                      type="button"
                      className="equipment-danger-button"
                      onClick={() =>
                        openReview(
                          request,
                          "approve"
                        )
                      }
                    >
                      Valider
                    </button>
                  </div>
                </article>
              )
            )}


            {!pending.length && (
              <div className="analytics-empty">
                Aucune demande en attente.
              </div>
            )}
          </div>
        )}
      </section>


      <section className="panel">
        <div className="analytics-section-heading">
          <div>
            <p className="eyebrow">
              HISTORIQUE
            </p>

            <h3>
              Demandes traitées
            </h3>
          </div>
        </div>


        <div className="equipment-deletion-history">

          {history.map(
            (request) => (
              <article
                className="equipment-deletion-history-row"
                key={request.id}
              >
                <div>
                  <span className="incident-reference">
                    {
                      request
                        .equipment_code
                    }
                  </span>

                  <strong>
                    {
                      request
                        .equipment_name
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Justification
                  </span>

                  <p>
                    {
                      request
                        .justification
                    }
                  </p>
                </div>

                <div>
                  <span>
                    Décision
                  </span>

                  <strong
                    className={
                      request.status
                      === "APPROVED"
                        ? "deletion-approved"
                        : "deletion-rejected"
                    }
                  >
                    {
                      request.status_label
                    }
                  </strong>

                  {request.review_note && (
                    <small>
                      {
                        request
                          .review_note
                      }
                    </small>
                  )}
                </div>

                <div>
                  <span>
                    Validateur
                  </span>

                  <strong>
                    {
                      request
                        .reviewed_by_name
                      || request
                        .reviewed_by_email
                      || "—"
                    }
                  </strong>

                  <small>
                    {
                      request.reviewed_at
                        ? new Date(
                            request
                              .reviewed_at
                          ).toLocaleString(
                            "fr-FR"
                          )
                        : ""
                    }
                  </small>
                </div>
              </article>
            )
          )}


          {!history.length && (
            <div className="analytics-empty">
              Aucune demande traitée.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
