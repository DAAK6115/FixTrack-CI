import { useAuth } from "../context/AuthContext";

const cards = [
  { label: "Incidents ouverts", value: "24", trend: "+3 aujourd'hui" },
  { label: "En intervention", value: "7", trend: "29 % des incidents" },
  { label: "Incidents critiques", value: "3", trend: "À traiter en priorité" },
  { label: "Résolution moyenne", value: "4h 18m", trend: "-12 % ce mois" },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">APERÇU OPÉRATIONNEL</p>
          <h2>Tableau de bord</h2>
          <p className="muted">
            Suivez les incidents et l'activité de{" "}
            <strong>{user?.organization?.name ?? "votre organisation"}</strong>.
          </p>
        </div>

        <button className="primary-button">+ Signaler un incident</button>
      </section>

      <section className="stats-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.trend}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ACTIVITÉ</p>
              <h3>Incidents récents</h3>
            </div>
            <button className="ghost-button">Voir tout</button>
          </div>

          <div className="incident-list">
            <div className="incident-row">
              <span className="status-dot critical" />
              <div>
                <strong>INC-2026-000182</strong>
                <p>Climatisation en panne — Salle B12</p>
              </div>
              <span className="badge">En cours</span>
            </div>

            <div className="incident-row">
              <span className="status-dot high" />
              <div>
                <strong>INC-2026-000181</strong>
                <p>Prise électrique défectueuse — Administration</p>
              </div>
              <span className="badge">Assigné</span>
            </div>

            <div className="incident-row">
              <span className="status-dot normal" />
              <div>
                <strong>INC-2026-000180</strong>
                <p>Connexion réseau instable — Bibliothèque</p>
              </div>
              <span className="badge success">Résolu</span>
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ÉQUIPE</p>
              <h3>Charge techniciens</h3>
            </div>
          </div>

          <div className="technician-list">
            <div>
              <strong>Kouassi Jean</strong>
              <span>5 interventions actives</span>
            </div>
            <div>
              <strong>Yao Eric</strong>
              <span>3 interventions actives</span>
            </div>
            <div>
              <strong>Traoré Moussa</strong>
              <span>2 interventions actives</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
