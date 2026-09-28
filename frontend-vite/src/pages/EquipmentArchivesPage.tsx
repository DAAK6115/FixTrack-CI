import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getArchivedEquipment,
} from "../api/equipment";

import type {
  ArchivedEquipmentRecord,
} from "../types/equipment";


export default function EquipmentArchivesPage() {
  const navigate = useNavigate();

  const [
    records,
    setRecords,
  ] = useState<
    ArchivedEquipmentRecord[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    getArchivedEquipment()
      .then(
        setRecords
      )
      .catch(() => {
        setError(
          "Impossible de charger les archives."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const filtered = useMemo(
    () => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "fr"
          );

      if (!query) {
        return records;
      }

      return records.filter(
        (record) => {
          const equipment =
            record.equipment;

          const deletion =
            record.deletion;

          return [
            equipment.code,
            equipment.name,
            equipment.category_name,
            equipment.site_name,
            deletion?.justification,
            deletion?.requested_by_name,
            deletion?.requested_by_email,
            deletion?.reviewed_by_name,
            deletion?.reviewed_by_email,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .toLocaleLowerCase(
              "fr"
            )
            .includes(
              query
            );
        }
      );
    },
    [
      records,
      search,
    ]
  );


  return (
    <div className="page-stack">

      <section className="hero-card equipment-hero">
        <div>
          <p className="eyebrow">
            HISTORIQUE DU PARC
          </p>

          <h2>
            Équipements archivés
          </h2>

          <p className="muted">
            Les équipements supprimés ne figurent
            plus dans le parc actif, mais leurs
            incidents, interventions et justificatifs
            restent conservés.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(
              "/equipment"
            )
          }
        >
          ← Parc actif
        </button>
      </section>


      <section className="panel equipment-archive-search">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Rechercher par code, nom, site, demandeur, motif..."
        />

        <span>
          {filtered.length}
          {" "}
          équipement(s) archivé(s)
        </span>
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
        <section className="equipment-archive-list">

          {filtered.map(
            (record) => {
              const equipment =
                record.equipment;

              const deletion =
                record.deletion;

              return (
                <article
                  className="panel equipment-archive-card"
                  key={
                    equipment.id
                  }
                >
                  <div className="equipment-archive-photo">
                    {equipment.image_url ? (
                      <img
                        src={
                          equipment
                            .image_url
                        }
                        alt={
                          equipment.name
                        }
                      />
                    ) : (
                      <span>
                        {
                          equipment
                            .category_icon
                          || "🧰"
                        }
                      </span>
                    )}
                  </div>


                  <div className="equipment-archive-main">
                    <div className="equipment-archive-title">
                      <div>
                        <span className="incident-reference">
                          {
                            equipment.code
                          }
                        </span>

                        <h3>
                          {
                            equipment.name
                          }
                        </h3>

                        <small>
                          {
                            equipment
                              .category_name
                          }
                          {" • "}
                          {
                            equipment
                              .site_name
                          }
                          {" • "}
                          {
                            equipment
                              .location_name
                          }
                        </small>
                      </div>

                      <span className="equipment-status equipment-status-archived">
                        Archivé
                      </span>
                    </div>


                    <div className="equipment-archive-audit">
                      <div>
                        <span>
                          Motif
                        </span>

                        <strong>
                          {
                            deletion
                              ?.justification
                            || (
                              "Motif non disponible"
                            )
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Demandé par
                        </span>

                        <strong>
                          {
                            deletion
                              ?.requested_by_name
                            || deletion
                              ?.requested_by_email
                            || "—"
                          }
                        </strong>

                        <small>
                          {
                            deletion
                              ?.requested_at
                            ? new Date(
                                deletion
                                  .requested_at
                              )
                              .toLocaleString(
                                "fr-FR"
                              )
                            : ""
                          }
                        </small>
                      </div>

                      <div>
                        <span>
                          Validé par
                        </span>

                        <strong>
                          {
                            deletion
                              ?.reviewed_by_name
                            || deletion
                              ?.reviewed_by_email
                            || "—"
                          }
                        </strong>

                        <small>
                          {
                            deletion
                              ?.reviewed_at
                            ? new Date(
                                deletion
                                  .reviewed_at
                              )
                              .toLocaleString(
                                "fr-FR"
                              )
                            : ""
                          }
                        </small>
                      </div>

                      <div>
                        <span>
                          Note admin
                        </span>

                        <strong>
                          {
                            deletion
                              ?.review_note
                            || "—"
                          }
                        </strong>
                      </div>
                    </div>
                  </div>


                  <div className="equipment-archive-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        navigate(
                          `/equipment/${equipment.id}`
                        )
                      }
                    >
                      Voir l'historique
                    </button>
                  </div>
                </article>
              );
            }
          )}


          {!filtered.length && (
            <section className="panel analytics-empty">
              Aucun équipement archivé.
            </section>
          )}
        </section>
      )}

    </div>
  );
}
