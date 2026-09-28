import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BrandLogo from
  "../components/BrandLogo";

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



function shouldRefreshRoute(
  pathname: string,
  notificationType: string
) {
  if (
    pathname === "/notifications"
  ) {
    return true;
  }

  const incidentEvent =
    notificationType.startsWith(
      "INCIDENT_"
    )
    || notificationType.startsWith(
      "INTERVENTION_"
    );

  if (incidentEvent) {
    if (
      pathname === "/dashboard"
      || pathname === "/analytics"
      || pathname === "/interventions"
      || pathname === "/incidents"
    ) {
      return true;
    }

    if (
      pathname.startsWith(
        "/incidents/"
      )
      && pathname
        !== "/incidents/new"
    ) {
      return true;
    }
  }

  const equipmentEvent =
    notificationType.startsWith(
      "EQUIPMENT_"
    );

  if (equipmentEvent) {
    if (
      pathname === "/equipment"
      || pathname
        === "/equipment/deletion-requests"
      || pathname
        === "/equipment/archives"
    ) {
      return true;
    }

    if (
      pathname.startsWith(
        "/equipment/"
      )
      && pathname
        !== "/equipment/qr-print"
      && !pathname.endsWith(
        "/report"
      )
      && !pathname.startsWith(
        "/equipment/scan/"
      )
    ) {
      return true;
    }
  }

  return false;
}


export default function AppLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    realtimeRevision,
    setRealtimeRevision,
  ] = useState(0);


  useEffect(() => {
    const handler = (
      event: Event
    ) => {
      if (
        !(event instanceof CustomEvent)
      ) {
        return;
      }

      const notification =
        event.detail;

      if (
        !notification
        || typeof notification
          !== "object"
        || typeof (
          notification
            .notification_type
        ) !== "string"
      ) {
        return;
      }

      if (
        shouldRefreshRoute(
          location.pathname,
          notification
            .notification_type
        )
      ) {
        setRealtimeRevision(
          (current) =>
            current + 1
        );
      }
    };


    window.addEventListener(
      "fixtrack:notification",
      handler
    );


    return () => {
      window.removeEventListener(
        "fixtrack:notification",
        handler
      );
    };
  }, [
    location.pathname,
  ]);


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

        <NavLink
          to="/dashboard"
          className="sidebar-brand-logo"
          aria-label="FixTrack CI - Tableau de bord"
        >
          <BrandLogo
            className="fixtrack-brand-logo-sidebar"
          />
        </NavLink>


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
          <Outlet
            key={
              `${location.pathname}-${realtimeRevision}`
            }
          />
        </section>

      </main>

    </div>
  );
}
