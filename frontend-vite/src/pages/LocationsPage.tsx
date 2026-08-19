import MapLocationPicker from
  "../components/MapLocationPicker";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createBuilding,
  createFloor,
  createLocation,
  createSite,
  deleteBuilding,
  deleteFloor,
  deleteLocation,
  deleteSite,
  getBuildings,
  getFloors,
  getLocations,
  getSites,
  updateBuilding,
  updateFloor,
  updateLocation,
  updateSite,
} from "../api/locations";

import { useAuth } from "../context/AuthContext";

import type {
  Building,
  Floor,
  Location,
  Site,
} from "../types/location";


const emptySiteForm = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
};

const emptyBuildingForm = {
  site: "",
  name: "",
  code: "",
};

const emptyFloorForm = {
  building: "",
  name: "",
  level: "0",
};

const emptyLocationForm = {
  floor: "",
  name: "",
  code: "",
  description: "",
  latitude: "",
  longitude: "",
};


export default function LocationsPage() {
  const { user } = useAuth();

  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";

  const [sites, setSites] = useState<Site[]>([]);
  const [buildings, setBuildings] = useState<
    Building[]
  >([]);
  const [floors, setFloors] = useState<Floor[]>(
    []
  );
  const [locations, setLocations] = useState<
    Location[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [siteForm, setSiteForm] = useState(
    emptySiteForm
  );

  const [
    buildingForm,
    setBuildingForm,
  ] = useState(emptyBuildingForm);

  const [floorForm, setFloorForm] = useState(
    emptyFloorForm
  );

  const [
    locationForm,
    setLocationForm,
  ] = useState(emptyLocationForm);

  const [editingSite, setEditingSite] = useState<
    number | null
  >(null);

  const [
    editingBuilding,
    setEditingBuilding,
  ] = useState<number | null>(null);

  const [
    editingFloor,
    setEditingFloor,
  ] = useState<number | null>(null);

  const [
    editingLocation,
    setEditingLocation,
  ] = useState<number | null>(null);


  const reload = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        sitesData,
        buildingsData,
        floorsData,
        locationsData,
      ] = await Promise.all([
        getSites(),
        getBuildings(),
        getFloors(),
        getLocations(),
      ]);

      setSites(sitesData);
      setBuildings(buildingsData);
      setFloors(floorsData);
      setLocations(locationsData);
    } catch {
      setError(
        "Impossible de charger les sites et lieux."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    reload();
  }, []);


  const submitSite = async (
    event: FormEvent
  ) => {
    event.preventDefault();
    setError("");
    if (
        !siteForm.latitude
        || !siteForm.longitude
      ) {
        setError(
          "Sélectionnez l'emplacement du site sur la carte."
        );

        return;
      }

    try {
      const payload = {
        name: siteForm.name,
        address: siteForm.address,

        latitude:
          siteForm.latitude || null,

        longitude:
          siteForm.longitude || null,
      };

      if (editingSite) {
        await updateSite(
          editingSite,
          payload
        );
      } else {
        await createSite(payload);
      }

      setSiteForm(emptySiteForm);
      setEditingSite(null);

      await reload();
    } catch {
      setError(
        "Impossible d'enregistrer le site."
      );
    }
  };


  const submitBuilding = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      const payload = {
        site: Number(buildingForm.site),
        name: buildingForm.name,
        code: buildingForm.code,
      };

      if (editingBuilding) {
        await updateBuilding(
          editingBuilding,
          payload
        );
      } else {
        await createBuilding(payload);
      }

      setBuildingForm(emptyBuildingForm);
      setEditingBuilding(null);

      await reload();
    } catch {
      setError(
        "Impossible d'enregistrer le bâtiment."
      );
    }
  };


  const submitFloor = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      const payload = {
        building: Number(
          floorForm.building
        ),
        name: floorForm.name,
        level: Number(floorForm.level),
      };

      if (editingFloor) {
        await updateFloor(
          editingFloor,
          payload
        );
      } else {
        await createFloor(payload);
      }

      setFloorForm(emptyFloorForm);
      setEditingFloor(null);

      await reload();
    } catch {
      setError(
        "Impossible d'enregistrer l'étage."
      );
    }
  };


  const submitLocation = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    try {
      const payload = {
        floor: Number(
          locationForm.floor
        ),

        name: locationForm.name,
        code: locationForm.code,

        description:
          locationForm.description,

        latitude:
          locationForm.latitude || null,

        longitude:
          locationForm.longitude || null,
      };

      if (editingLocation) {
        await updateLocation(
          editingLocation,
          payload
        );
      } else {
        await createLocation(payload);
      }

      setLocationForm(emptyLocationForm);
      setEditingLocation(null);

      await reload();
    } catch {
      setError(
        "Impossible d'enregistrer le lieu."
      );
    }
  };


  if (loading) {
    return (
      <div className="panel">
        Chargement...
      </div>
    );
  }


  return (
    <div className="page-stack">
      <section className="hero-card">
        <div>
          <p className="eyebrow">
            STRUCTURE DE L'ORGANISATION
          </p>

          <h2>Sites & lieux</h2>

          <p className="muted">
            Gérez les sites, bâtiments,
            étages et salles de votre
            organisation.
          </p>
        </div>

        <div className="summary-inline">
          <span>
            <strong>{sites.length}</strong>
            sites
          </span>

          <span>
            <strong>
              {buildings.length}
            </strong>
            bâtiments
          </span>

          <span>
            <strong>
              {locations.length}
            </strong>
            lieux
          </span>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      <section className="resource-grid">

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                NIVEAU 1
              </p>

              <h3>Sites</h3>
            </div>
          </div>

          {canManage && (
            <form
              className="resource-form"
              onSubmit={submitSite}
            >
              <label className="field">
                Nom du site

                <input
                  value={siteForm.name}
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,
                      name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                Adresse

                <input
                  value={
                    siteForm.address
                  }
                  onChange={(event) =>
                    setSiteForm({
                      ...siteForm,

                      address:
                        event.target.value,
                    })
                  }
                  placeholder="L'adresse sera renseignée après sélection sur la carte."
                />
              </label>

              <MapLocationPicker
                key={
                  editingSite
                    ? `site-${editingSite}`
                    : "new-site"
                }

                value={{
                  address:
                    siteForm.address,

                  latitude:
                    siteForm.latitude,

                  longitude:
                    siteForm.longitude,
                }}

                onChange={(location) => {
                  setSiteForm(
                    (current) => ({
                      ...current,

                      address:
                        location.address,

                      latitude:
                        location.latitude,

                      longitude:
                        location.longitude,
                    })
                  );
                }}
              />

              <div className="form-actions">
                <button
                  className="primary-button"
                  type="submit"
                >
                  {editingSite
                    ? "Enregistrer"
                    : "Ajouter le site"}
                </button>

                {editingSite && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingSite(null);
                      setSiteForm(
                        emptySiteForm
                      );
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="entity-list">
            {sites.map((site) => (
              <div
                className="entity-item"
                key={site.id}
              >
                <div>
                  <strong>
                    {site.name}
                  </strong>

                  <span>
                    {site.address ||
                      "Adresse non renseignée"}
                  </span>
                </div>

                {canManage && (
                  <div className="entity-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditingSite(
                          site.id
                        );

                        setSiteForm({
                          name: site.name,
                          address:
                            site.address,
                          latitude:
                            site.latitude ||
                            "",
                          longitude:
                            site.longitude ||
                            "",
                        });
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      className="danger-text-button"
                      onClick={async () => {
                        if (
                          !confirm(
                            "Désactiver ce site ?"
                          )
                        ) {
                          return;
                        }

                        await deleteSite(
                          site.id
                        );

                        await reload();
                      }}
                    >
                      Désactiver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>


        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                NIVEAU 2
              </p>

              <h3>Bâtiments</h3>
            </div>
          </div>

          {canManage && (
            <form
              className="resource-form"
              onSubmit={submitBuilding}
            >
              <label className="field">
                Site

                <select
                  value={
                    buildingForm.site
                  }
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      site:
                        event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Choisir un site
                  </option>

                  {sites.map((site) => (
                    <option
                      key={site.id}
                      value={site.id}
                    >
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                Nom du bâtiment

                <input
                  value={
                    buildingForm.name
                  }
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                Code

                <input
                  value={
                    buildingForm.code
                  }
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      code:
                        event.target.value,
                    })
                  }
                />
              </label>

              <div className="form-actions">
                <button
                  className="primary-button"
                >
                  {editingBuilding
                    ? "Enregistrer"
                    : "Ajouter le bâtiment"}
                </button>

                {editingBuilding && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingBuilding(
                        null
                      );

                      setBuildingForm(
                        emptyBuildingForm
                      );
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="entity-list">
            {buildings.map(
              (building) => (
                <div
                  className="entity-item"
                  key={building.id}
                >
                  <div>
                    <strong>
                      {building.name}
                    </strong>

                    <span>
                      {building.site_name}

                      {building.code
                        ? ` • ${building.code}`
                        : ""}
                    </span>
                  </div>

                  {canManage && (
                    <div className="entity-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setEditingBuilding(
                            building.id
                          );

                          setBuildingForm({
                            site: String(
                              building.site
                            ),
                            name:
                              building.name,
                            code:
                              building.code,
                          });
                        }}
                      >
                        Modifier
                      </button>

                      <button
                        className="danger-text-button"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Désactiver ce bâtiment ?"
                            )
                          ) {
                            return;
                          }

                          await deleteBuilding(
                            building.id
                          );

                          await reload();
                        }}
                      >
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </article>


        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                NIVEAU 3
              </p>

              <h3>Étages</h3>
            </div>
          </div>

          {canManage && (
            <form
              className="resource-form"
              onSubmit={submitFloor}
            >
              <label className="field">
                Bâtiment

                <select
                  value={
                    floorForm.building
                  }
                  onChange={(event) =>
                    setFloorForm({
                      ...floorForm,
                      building:
                        event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Choisir un bâtiment
                  </option>

                  {buildings.map(
                    (building) => (
                      <option
                        key={building.id}
                        value={
                          building.id
                        }
                      >
                        {
                          building.site_name
                        }
                        {" — "}
                        {building.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="field">
                Nom

                <input
                  value={floorForm.name}
                  onChange={(event) =>
                    setFloorForm({
                      ...floorForm,
                      name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                Niveau

                <input
                  type="number"
                  value={
                    floorForm.level
                  }
                  onChange={(event) =>
                    setFloorForm({
                      ...floorForm,
                      level:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="form-actions">
                <button
                  className="primary-button"
                >
                  {editingFloor
                    ? "Enregistrer"
                    : "Ajouter l'étage"}
                </button>

                {editingFloor && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingFloor(
                        null
                      );

                      setFloorForm(
                        emptyFloorForm
                      );
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="entity-list">
            {floors.map((floor) => (
              <div
                className="entity-item"
                key={floor.id}
              >
                <div>
                  <strong>
                    {floor.name}
                  </strong>

                  <span>
                    {floor.site_name}
                    {" • "}
                    {
                      floor.building_name
                    }
                  </span>
                </div>

                {canManage && (
                  <div className="entity-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditingFloor(
                          floor.id
                        );

                        setFloorForm({
                          building: String(
                            floor.building
                          ),
                          name:
                            floor.name,
                          level: String(
                            floor.level
                          ),
                        });
                      }}
                    >
                      Modifier
                    </button>

                    <button
                      className="danger-text-button"
                      onClick={async () => {
                        if (
                          !confirm(
                            "Désactiver cet étage ?"
                          )
                        ) {
                          return;
                        }

                        await deleteFloor(
                          floor.id
                        );

                        await reload();
                      }}
                    >
                      Désactiver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>


        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                NIVEAU 4
              </p>

              <h3>Salles / zones</h3>
            </div>
          </div>

          {canManage && (
            <form
              className="resource-form"
              onSubmit={submitLocation}
            >
              <label className="field">
                Étage

                <select
                  value={
                    locationForm.floor
                  }
                  onChange={(event) =>
                    setLocationForm({
                      ...locationForm,
                      floor:
                        event.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Choisir un étage
                  </option>

                  {floors.map((floor) => (
                    <option
                      key={floor.id}
                      value={floor.id}
                    >
                      {floor.site_name}
                      {" — "}
                      {
                        floor.building_name
                      }
                      {" — "}
                      {floor.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                Nom

                <input
                  value={
                    locationForm.name
                  }
                  onChange={(event) =>
                    setLocationForm({
                      ...locationForm,
                      name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                Code

                <input
                  value={
                    locationForm.code
                  }
                  onChange={(event) =>
                    setLocationForm({
                      ...locationForm,
                      code:
                        event.target.value,
                    })
                  }
                />
              </label>

              <label className="field">
                Description

                <textarea
                  value={
                    locationForm.description
                  }
                  onChange={(event) =>
                    setLocationForm({
                      ...locationForm,
                      description:
                        event.target.value,
                    })
                  }
                  rows={3}
                />
              </label>

              <div className="form-actions">
                <button
                  className="primary-button"
                >
                  {editingLocation
                    ? "Enregistrer"
                    : "Ajouter le lieu"}
                </button>

                {editingLocation && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingLocation(
                        null
                      );

                      setLocationForm(
                        emptyLocationForm
                      );
                    }}
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          )}

          <div className="entity-list">
            {locations.map(
              (location) => (
                <div
                  className="entity-item"
                  key={location.id}
                >
                  <div>
                    <strong>
                      {location.name}
                    </strong>

                    <span>
                      {location.site_name}
                      {" • "}
                      {
                        location.building_name
                      }
                      {" • "}
                      {
                        location.floor_name
                      }
                    </span>
                  </div>

                  {canManage && (
                    <div className="entity-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setEditingLocation(
                            location.id
                          );

                          setLocationForm({
                            floor: String(
                              location.floor
                            ),
                            name:
                              location.name,
                            code:
                              location.code,
                            description:
                              location.description,
                            latitude:
                              location.latitude ||
                              "",
                            longitude:
                              location.longitude ||
                              "",
                          });
                        }}
                      >
                        Modifier
                      </button>

                      <button
                        className="danger-text-button"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Désactiver ce lieu ?"
                            )
                          ) {
                            return;
                          }

                          await deleteLocation(
                            location.id
                          );

                          await reload();
                        }}
                      >
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </article>

      </section>
    </div>
  );
}