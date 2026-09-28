import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import NotificationBell from
  "../components/NotificationBell";

import {
  useAuth,
} from "../context/AuthContext";


const roleLabels = {
  ADMIN: "Administrateur",
  MANAGER: "Responsable",
  TECHNICIAN: "Technicien",
  REQUESTER: "Demandeur",
};


export default function AppLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();


  if (!user) {
    return null;
  }


  const signOut = () => {
    logout();

    navigate(
      "/login"
    );
  };


  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-mark">
            F
          </div>

          <div>
            <strong>
              FixTrack CI
            </strong>

            <span>
              Maintenance & incidents
            </span>
          </div>
        </div>


        <nav className="nav">

          <NavLink to="/dashboard">
            Tableau de bord
          </NavLink>

          <NavLink to="/incidents">
            Incidents
          </NavLink>

          <NavLink to="/locations">
            Sites & lieux
          </NavLink>

          <NavLink to="/equipment">
            Équipements
          </NavLink>


          {(
            user.role === "TECHNICIAN"
            || user.role === "MANAGER"
            || user.role === "ADMIN"
          ) && (
            <NavLink to="/interventions">
              Interventions
            </NavLink>
          )}


          {(
            user.role === "MANAGER"
            || user.role === "ADMIN"
          ) && (
            <>
              <NavLink to="/technicians">
                Techniciens
              </NavLink>

              <NavLink to="/analytics">
                Analytics
              </NavLink>
            </>
          )}


          {user.role === "ADMIN" && (
            <>
              <NavLink to="/users">
                Utilisateurs
              </NavLink>

              <NavLink to="/settings">
                Paramètres
              </NavLink>
            </>
          )}

        </nav>


        <button
          className="logout-button"
          onClick={signOut}
        >
          Déconnexion
        </button>

      </aside>


      <main className="main">

        <header className="topbar">

          <div>
            <p className="eyebrow">
              {
                user.organization
                  ?.name
                ?? "FixTrack CI"
              }
            </p>

            <h1>
              Bonjour{" "}
              {
                user.first_name
                || user.full_name
              }
            </h1>
          </div>


          <div className="topbar-actions">

            <NotificationBell />


            <div className="profile-chip">

              <div className="avatar">
                {
                  (
                    user
                      .first_name?.[0]
                    ?? user.email[0]
                  )
                  .toUpperCase()
                }
              </div>

              <div>
                <strong>
                  {user.full_name}
                </strong>

                <span>
                  {
                    roleLabels[
                      user.role
                    ]
                  }
                </span>
              </div>

            </div>

          </div>

        </header>


        <section className="content">
          <Outlet />
        </section>

      </main>

    </div>
  );
}
