import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getIncidentCategories,
  getIncidents,
} from "../api/incidents";

import {
  getSites,
} from "../api/locations";

import type {
  IncidentCategory,
  IncidentListItem,
} from "../types/incident";

import type {
  Site,
} from "../types/location";


const priorityClass: Record<
  string,
  string
> = {
  LOW: "priority-low",
  NORMAL: "priority-normal",
  HIGH: "priority-high",
  CRITICAL: "priority-critical",
};


export default function IncidentsPage() {
  const navigate = useNavigate();


  const [
    incidents,
    setIncidents,
  ] = useState<
    IncidentListItem[]
  >([]);

  const [
    categories,
    setCategories,
  ] = useState<
    IncidentCategory[]
  >([]);

  const [
    sites,
    setSites,
  ] = useState<Site[]>([]);


  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    site,
    setSite,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  const loadIncidents =
    async () => {
      setLoading(true);
      setError("");

      try {
        setIncidents(
          await getIncidents({
            search:
              search || undefined,

            status:
              statusFilter || undefined,

            priority:
              priority || undefined,

            category:
              category || undefined,

            site:
              site || undefined,
          })
        );
      } catch {
        setError(
          "Impossible de charger les incidents."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    Promise.all([
      getIncidentCategories(),
      getSites(),
    ])
      .then(
        ([
          categoriesData,
          sitesData,
        ]) => {
          setCategories(
            categoriesData
          );

          setSites(
            sitesData
          );
        }
      )
      .catch(() => {
        setError(
          "Impossible de charger les filtres."
        );
      });

    loadIncidents();
  }, []);


  const submitSearch = (
    event: FormEvent
  ) => {
    event.preventDefault();

    loadIncidents();
  };


  return (
    <div className="page-stack">

      <section className="hero-card incidents-hero">

        <div>
          <p className="eyebrow">
            INCIDENTS
          </p>

          <h2>
            Suivi des signalements
          </h2>

          <p className="muted">
            Consultez et suivez les
            incidents de votre
            organisation.
          </p>
        </div>


        <button
          className="primary-button"
          onClick={() =>
            navigate(
              "/incidents/new"
            )
          }
        >
          + Signaler un incident
        </button>

      </section>


      <section className="panel">

        <form
          className="incident-filter-bar"
          onSubmit={submitSearch}
        >
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher une référence, un problème, un lieu..."
          />


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Tous les statuts
            </option>

            <option value="REPORTED">
              Signalé
            </option>

            <option value="VALIDATED">
              Validé
            </option>

            <option value="ASSIGNED">
              Assigné
            </option>

            <option value="IN_PROGRESS">
              En cours
            </option>

            <option value="RESOLVED">
              Résolu
            </option>

            <option value="CLOSED">
              Fermé
            </option>
          </select>


          <select
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value
              )
            }
          >
            <option value="">
              Toutes priorités
            </option>

            <option value="LOW">
              Faible
            </option>

            <option value="NORMAL">
              Normale
            </option>

            <option value="HIGH">
              Haute
            </option>

            <option value="CRITICAL">
              Critique
            </option>
          </select>


          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target.value
              )
            }
          >
            <option value="">
              Toutes catégories
            </option>

            {categories.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>


          <select
            value={site}
            onChange={(event) =>
              setSite(
                event.target.value
              )
            }
          >
            <option value="">
              Tous les sites
            </option>

            {sites.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.name}
                </option>
              )
            )}
          </select>


          <button
            className="secondary-button"
          >
            Filtrer
          </button>

        </form>

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
        <section className="incident-list-grid">

          {incidents.map(
            (incident) => (
              <article
                className="incident-card"
                key={incident.id}
                onClick={() =>
                  navigate(
                    `/incidents/${incident.id}`
                  )
                }
              >
                <div className="incident-card-image">
                  {incident.cover_image ? (
                    <img
                      src={
                        incident.cover_image
                      }
                      alt=""
                    />
                  ) : (
                    <div className="incident-no-image">
                      🔧
                    </div>
                  )}
                </div>


                <div className="incident-card-body">

                  <div className="incident-card-top">
                    <span className="incident-reference">
                      {incident.reference}
                    </span>

                    <span
                      className={`incident-priority ${priorityClass[
                        incident.requested_priority
                      ]}`}
                    >
                      {
                        incident.requested_priority_label
                      }
                    </span>
                  </div>


                  <h3>
                    {incident.title}
                  </h3>


                  <p>
                    {incident.category_name}
                  </p>


                  <div className="incident-location">
                    📍{" "}
                    {incident.site_name}
                    {" • "}
                    {incident.building_name}
                    {" • "}
                    {incident.location_name}
                  </div>


                  <div className="incident-card-footer">

                    <span className={`incident-status status-${incident.status.toLowerCase()}`}>
                      {
                        incident.status_label
                      }
                    </span>

                    <time>
                      {new Date(
                        incident.reported_at
                      ).toLocaleDateString(
                        "fr-FR",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </time>

                  </div>

                </div>
              </article>
            )
          )}


          {!incidents.length && (
            <article className="panel incident-empty">
              <span>✅</span>

              <h3>
                Aucun incident trouvé
              </h3>

              <p className="muted">
                Aucun signalement ne
                correspond aux critères.
              </p>
            </article>
          )}

        </section>
      )}

    </div>
  );
}