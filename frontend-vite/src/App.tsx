import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import AppLayout from "./layouts/AppLayout";

import DashboardPage from "./pages/DashboardPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";
import IncidentsPage from "./pages/IncidentsPage";
import LocationsPage from "./pages/LocationsPage";
import LoginPage from "./pages/LoginPage";
import NewIncidentPage from "./pages/NewIncidentPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import TechniciansPage from "./pages/TechniciansPage";
import UsersPage from "./pages/UsersPage";


export default function App() {
  return (
    <Routes>

      <Route
        path="/login"
        element={<LoginPage />}
      />


      <Route element={<ProtectedRoute />}>

        <Route element={<AppLayout />}>

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />


          <Route
            path="/incidents"
            element={<IncidentsPage />}
          />


          <Route
            path="/incidents/new"
            element={<NewIncidentPage />}
          />


          <Route
            path="/incidents/:id"
            element={<IncidentDetailPage />}
          />


          <Route
            path="/locations"
            element={<LocationsPage />}
          />


          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "TECHNICIAN",
                  "MANAGER",
                  "ADMIN",
                ]}
              />
            }
          >
            <Route
              path="/interventions"
              element={
                <PlaceholderPage
                  title="Interventions"
                />
              }
            />
          </Route>


          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "MANAGER",
                  "ADMIN",
                ]}
              />
            }
          >
            <Route
              path="/technicians"
              element={
                <TechniciansPage />
              }
            />

            <Route
              path="/analytics"
              element={
                <PlaceholderPage
                  title="Analytics"
                />
              }
            />
          </Route>


          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  "ADMIN",
                ]}
              />
            }
          >
            <Route
              path="/users"
              element={<UsersPage />}
            />

            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Paramètres"
                />
              }
            />
          </Route>

        </Route>

      </Route>


      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
  );
}