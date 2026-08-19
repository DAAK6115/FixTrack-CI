import {
  useEffect,
  useState,
} from "react";

import {
  getTechnicians,
} from "../api/users";

import type {
  ManagedUser,
} from "../types/user";


export default function TechniciansPage() {
  const [
    technicians,
    setTechnicians,
  ] = useState<ManagedUser[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] = useState("");


  useEffect(() => {
    getTechnicians()
      .then(setTechnicians)
      .catch(() => {
        setError(
          "Impossible de charger les techniciens."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <p className="eyebrow">
            MAINTENANCE
          </p>

          <h2>Techniciens</h2>

          <p className="muted">
            Consultez les membres de
            l'équipe technique disponibles
            dans votre organisation.
          </p>
        </div>

        <div className="summary-inline">
          <span>
            <strong>
              {technicians.length}
            </strong>
            techniciens
          </span>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {loading ? (
        <div className="panel">
          Chargement...
        </div>
      ) : (
        <section className="technician-grid">
          {technicians.map(
            (technician) => (
              <article
                className="technician-card"
                key={technician.id}
              >
                <div className="technician-avatar">
                  {(
                    technician
                      .first_name?.[0] ||
                    technician.email[0]
                  ).toUpperCase()}
                </div>

                <div>
                  <h3>
                    {
                      technician.full_name
                    }
                  </h3>

                  <p>
                    {technician.email}
                  </p>

                  <p>
                    {technician.phone ||
                      "Téléphone non renseigné"}
                  </p>
                </div>

                <div className="technician-status">
                  <span className="active-dot" />

                  Disponible
                </div>
              </article>
            )
          )}

          {!technicians.length && (
            <article className="panel">
              Aucun technicien n'a encore
              été créé.
            </article>
          )}
        </section>
      )}

    </div>
  );
}