import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  resolveEquipment,
} from "../api/equipment";

import BrandLogo from
  "../components/BrandLogo";

import type {
  Equipment,
} from "../types/equipment";


export default function EquipmentScanPage() {
  const {
    token,
  } = useParams();

  const navigate = useNavigate();


  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment | null
  >(null);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!token) {
      setError(
        "QR Code invalide."
      );

      return;
    }

    resolveEquipment(
      token
    )
      .then(
        setEquipment
      )
      .catch(() => {
        setError(
          "Cet équipement est introuvable ou n'est plus actif."
        );
      });
  }, [token]);


  if (error) {
    return (
      <div className="equipment-scan-page">
        <section className="panel equipment-scan-card">
          <BrandLogo
            className="fixtrack-brand-logo-scan"
          />

          <span className="equipment-scan-icon">
            ❌
          </span>

          <h2>
            Équipement introuvable
          </h2>

          <p className="muted">
            {error}
          </p>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                "/equipment"
              )
            }
          >
            Voir les équipements
          </button>
        </section>
      </div>
    );
  }


  if (!equipment) {
    return (
      <div className="equipment-scan-page">
        <section className="panel equipment-scan-card">
          <BrandLogo
            className="fixtrack-brand-logo-scan"
          />

          <p className="muted">
            Lecture du QR Code...
          </p>
        </section>
      </div>
    );
  }


  return (
    <div className="equipment-scan-page">

      <section className="panel equipment-scan-card">
        <BrandLogo
          className="fixtrack-brand-logo-scan"
        />

        <div className="equipment-scan-icon">
          {
            equipment.category_icon
            || "🔧"
          }
        </div>

        <p className="eyebrow">
          ÉQUIPEMENT IDENTIFIÉ
        </p>

        <h2>
          {equipment.name}
        </h2>

        <span className="incident-reference">
          {equipment.code}
        </span>

        <p>
          📍{" "}
          {equipment.site_name}
          {" • "}
          {
            equipment.location_name
          }
        </p>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate(
              `/equipment/${equipment.id}`
            )
          }
        >
          Ouvrir la fiche
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(
              `/equipment/${equipment.id}/report`
            )
          }
        >
          Signaler une panne
        </button>
      </section>

    </div>
  );
}
