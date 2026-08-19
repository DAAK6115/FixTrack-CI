import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@fixtrack.ci");
  const [password, setPassword] = useState("FixTrack123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("E-mail ou mot de passe incorrect.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-copy">
          <div className="brand large">
            <div className="brand-mark">F</div>
            <div>
              <strong>FixTrack CI</strong>
              <span>Maintenance & incidents</span>
            </div>
          </div>

          <div>
            <p className="eyebrow">GESTION DES INCIDENTS</p>
            <h1>Signalez. Assignez. Résolvez.</h1>
            <p className="muted">
              Une plateforme simple pour suivre les incidents techniques,
              coordonner les équipes et mesurer les délais de résolution.
            </p>
          </div>
        </div>

        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">CONNEXION</p>
            <h2>Accéder à FixTrack</h2>
            <p className="muted">Utilisez votre compte organisation.</p>
          </div>

          <label>
            Adresse e-mail
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="primary-button" disabled={submitting}>
            {submitting ? "Connexion..." : "Se connecter"}
          </button>

          <p className="demo-note">
            Démo : admin@fixtrack.ci / FixTrack123!
          </p>
        </form>
      </div>
    </div>
  );
}
