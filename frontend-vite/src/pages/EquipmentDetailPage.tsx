import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/client";

import {
  getEquipmentIncidents,
  getEquipmentItem,
  getEquipmentQrUrl,
} from "../api/equipment";

import type {
  Equipment,
} from "../types/equipment";

import type {
  IncidentListItem,
} from "../types/incident";


export default function EquipmentDetailPage() {
  const {
    id,
  } = useParams();

  const navigate = useNavigate();


  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment | null
  >(null);

  const [
    incidents,
    setIncidents,
  ] = useState<
    IncidentListItem[]
  >([]);

  const [
    qrUrl,
    setQrUrl,
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
    if (!id) {
      return;
    }

    const equipmentId =
      Number(id);

    let objectUrl = "";

    Promise.all([
      getEquipmentItem(
        equipmentId
      ),
      getEquipmentIncidents(
        equipmentId
      ),
    ])
      .then(
        ([
          equipmentData,
          incidentsData,
        ]) => {
          setEquipment(
            equipmentData
          );

          setIncidents(
            incidentsData
          );
        }
      )
      .catch(() => {
        setError(
          "Impossible de charger l'équipement."
        );
      })
      .finally(() => {
        setLoading(false);
      });


    api.get(
      getEquipmentQrUrl(
        equipmentId
      ),
      {
        responseType:
          "blob",
      }
    )
      .then(
        (response) => {
          objectUrl =
            URL.createObjectURL(
              response.data
            );

          setQrUrl(
            objectUrl
          );
        }
      )
      .catch(() => {
        // La fiche reste utilisable
        // si le QR n'est pas disponible.
      });


    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [id]);


  if (loading) {
    return (
      <section className="panel">
        Chargement...
      </section>
    );
  }


  if (
    error
    || !equipment
  ) {
    return (
      <div className="error-box">
        {error
          || "Équipement introuvable."}
      </div>
    );
  }


  return (
    <div className="page-stack">

      <section className="equipment-detail-hero">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/equipment"
              )
            }
          >
            ← Équipements
          </button>

          <div className="equipment-detail-title">
            <div className="equipment-detail-icon">
              {
                equipment.category_icon
                || "🔧"
              }
            </div>

            <div>
              <p className="eyebrow">
                {equipment.code}
              </p>

              <h2>
                {equipment.name}
              </h2>

              <span
                className={
                  `equipment-status equipment-status-${equipment.status.toLowerCase()}`
                }
              >
                {
                  equipment.status_label
                }
              </span>
            </div>
          </div>
        </div>


        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate(
              `/equipment/${equipment.id}/report`
            )
          }
        >
          + Signaler une panne
        </button>
      </section>


      <div className="equipment-detail-layout">

        <main className="equipment-detail-main">

          <section className="panel">
            <p className="eyebrow">
              INFORMATIONS TECHNIQUES
            </p>

            <div className="equipment-info-grid">
              <div>
                <span>
                  Catégorie
                </span>
                <strong>
                  {
                    equipment.category_icon
                  }{" "}
                  {
                    equipment.category_name
                  }
                </strong>
              </div>

              <div>
                <span>
                  Marque
                </span>
                <strong>
                  {
                    equipment.brand
                    || "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Modèle
                </span>
                <strong>
                  {
                    equipment.model_name
                    || "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  N° de série
                </span>
                <strong>
                  {
                    equipment.serial_number
                    || "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Installation
                </span>
                <strong>
                  {
                    equipment
                      .installation_date
                    ? new Date(
                        equipment
                          .installation_date
                      ).toLocaleDateString(
                        "fr-FR"
                      )
                    : "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Code
                </span>
                <strong>
                  {equipment.code}
                </strong>
              </div>
            </div>


            {equipment.description && (
              <div className="equipment-description">
                <span>
                  Description
                </span>

                <p>
                  {
                    equipment.description
                  }
                </p>
              </div>
            )}
          </section>


          <section className="panel">
            <div className="analytics-section-heading">
              <div>
                <p className="eyebrow">
                  MAINTENANCE
                </p>

                <h3>
                  Historique des incidents
                </h3>
              </div>
            </div>


            <div className="analytics-recent-list">
              {incidents.map(
                (incident) => (
                  <button
                    type="button"
                    className="analytics-recent-row"
                    key={
                      incident.id
                    }
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
                        {
                          incident.title
                        }
                      </strong>

                      <small>
                        {
                          incident
                            .category_name
                        }
                        {" • "}
                        {new Date(
                          incident.reported_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}
                      </small>
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

                    <span className="analytics-row-arrow">
                      →
                    </span>
                  </button>
                )
              )}

              {!incidents.length && (
                <div className="analytics-empty">
                  Aucun incident lié
                  à cet équipement.
                </div>
              )}
            </div>
          </section>

        </main>


        <aside className="equipment-detail-sidebar">

          <section className="panel equipment-location-card">
            <p className="eyebrow">
              LOCALISATION
            </p>

            <strong>
              📍{" "}
              {equipment.site_name}
            </strong>

            <span>
              {
                equipment
                  .building_name
              }
            </span>

            <span>
              {
                equipment.floor_name
              }
            </span>

            <span>
              {
                equipment.location_name
              }
            </span>

            {equipment.site_address && (
              <small>
                {
                  equipment
                    .site_address
                }
              </small>
            )}
          </section>


          <section className="panel equipment-qr-card">
            <p className="eyebrow">
              QR CODE
            </p>

            <h3>
              Identification rapide
            </h3>

            <p className="muted">
              Le QR ouvre directement
              cette fiche équipement.
            </p>


            {qrUrl ? (
              <img
                className="equipment-qr-image"
                src={qrUrl}
                alt={
                  `QR Code ${equipment.code}`
                }
              />
            ) : (
              <div className="equipment-qr-placeholder">
                QR indisponible
              </div>
            )}


            <small className="equipment-qr-token">
              {
                equipment.qr_token
              }
            </small>
          </section>

        </aside>

      </div>

    </div>
  );
}
