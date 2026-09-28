import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createEquipment,
  createEquipmentCategory,
  getEquipment,
  getEquipmentCategories,
} from "../api/equipment";

import {
  getBuildings,
  getFloors,
  getLocations,
  getSites,
} from "../api/locations";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
} from "../types/equipment";

import type {
  Building,
  Floor,
  Location,
  Site,
} from "../types/location";


type EquipmentFormState = {
  code: string;
  name: string;
  category: string;
  site: string;
  building: string;
  floor: string;
  location: string;
  brand: string;
  model_name: string;
  serial_number: string;
  installation_date: string;
  status: EquipmentStatus;
  description: string;
};


const statusLabels:
  Record<
    EquipmentStatus,
    string
  > = {
    ACTIVE: "Actif",
    MAINTENANCE: "En maintenance",
    OUT_OF_SERVICE: "Hors service",
  };


const initialForm:
  EquipmentFormState = {
    code: "",
    name: "",
    category: "",
    site: "",
    building: "",
    floor: "",
    location: "",
    brand: "",
    model_name: "",
    serial_number: "",
    installation_date: "",
    status: "ACTIVE",
    description: "",
  };


export default function EquipmentPage() {
  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment[]
  >([]);

  const [
    categories,
    setCategories,
  ] = useState<
    EquipmentCategory[]
  >([]);

  const [
    sites,
    setSites,
  ] = useState<Site[]>([]);

  const [
    buildings,
    setBuildings,
  ] = useState<
    Building[]
  >([]);

  const [
    floors,
    setFloors,
  ] = useState<Floor[]>([]);

  const [
    locations,
    setLocations,
  ] = useState<
    Location[]
  >([]);


  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");


  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    showCategoryCreate,
    setShowCategoryCreate,
  ] = useState(false);


  const [
    categoryName,
    setCategoryName,
  ] = useState("");

  const [
    categoryIcon,
    setCategoryIcon,
  ] = useState("🔧");

  const [
    categoryDescription,
    setCategoryDescription,
  ] = useState("");

  const [
    categorySaving,
    setCategorySaving,
  ] = useState(false);

  const [
    categoryError,
    setCategoryError,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    equipmentImage,
    setEquipmentImage,
  ] = useState<File | null>(
    null
  );

  const [
    equipmentImagePreview,
    setEquipmentImagePreview,
  ] = useState("");


  const [
    form,
    setForm,
  ] = useState<
    EquipmentFormState
  >(initialForm);


  const canManage =
    user?.role === "ADMIN"
    || user?.role === "MANAGER";


  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        equipmentData,
        categoriesData,
        sitesData,
      ] = await Promise.all([
        getEquipment({
          search:
            search || undefined,

          status:
            statusFilter
            || undefined,
        }),

        getEquipmentCategories(),

        getSites(),
      ]);

      setEquipment(
        equipmentData
      );

      setCategories(
        categoriesData
      );

      setSites(
        sitesData
      );
    } catch {
      setError(
        "Impossible de charger les équipements."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    void load();
  }, []);


  useEffect(() => {
    if (!equipmentImage) {
      setEquipmentImagePreview(
        ""
      );

      return;
    }

    const objectUrl =
      URL.createObjectURL(
        equipmentImage
      );

    setEquipmentImagePreview(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [
    equipmentImage,
  ]);


  const stats = useMemo(
    () => ({
      total:
        equipment.length,

      active:
        equipment.filter(
          (item) =>
            item.status
            === "ACTIVE"
        ).length,

      maintenance:
        equipment.filter(
          (item) =>
            item.status
            === "MAINTENANCE"
        ).length,

      unavailable:
        equipment.filter(
          (item) =>
            item.status
            === "OUT_OF_SERVICE"
        ).length,
    }),
    [equipment]
  );


  const updateForm = (
    field:
      keyof EquipmentFormState,
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  };


  const createCategory = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    const name =
      categoryName.trim();

    if (!name) {
      setCategoryError(
        "Le nom de la catégorie est obligatoire."
      );

      return;
    }

    setCategorySaving(true);
    setCategoryError("");

    try {
      const created =
        await createEquipmentCategory({
          name,
          icon:
            categoryIcon.trim()
            || "🔧",

          description:
            categoryDescription.trim(),
        });

      setCategories(
        (current) => {
          const withoutDuplicate =
            current.filter(
              (item) =>
                item.id
                !== created.id
            );

          return [
            ...withoutDuplicate,
            created,
          ].sort(
            (first, second) =>
              first.name.localeCompare(
                second.name,
                "fr"
              )
          );
        }
      );

      setForm(
        (current) => ({
          ...current,
          category:
            String(
              created.id
            ),
        })
      );

      setCategoryName("");
      setCategoryIcon("🔧");
      setCategoryDescription("");

      setShowCategoryCreate(
        false
      );
    } catch {
      setCategoryError(
        "Impossible de créer la catégorie. Vérifiez qu'elle n'existe pas déjà."
      );
    } finally {
      setCategorySaving(false);
    }
  };


  const selectSite = async (
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        site: value,
        building: "",
        floor: "",
        location: "",
      })
    );

    setBuildings([]);
    setFloors([]);
    setLocations([]);

    if (!value) {
      return;
    }

    try {
      setBuildings(
        await getBuildings(
          Number(value)
        )
      );
    } catch {
      setError(
        "Impossible de charger les bâtiments."
      );
    }
  };


  const selectBuilding =
    async (
      value: string
    ) => {
      setForm(
        (current) => ({
          ...current,
          building: value,
          floor: "",
          location: "",
        })
      );

      setFloors([]);
      setLocations([]);

      if (!value) {
        return;
      }

      try {
        setFloors(
          await getFloors(
            Number(value)
          )
        );
      } catch {
        setError(
          "Impossible de charger les étages."
        );
      }
    };


  const selectFloor = async (
    value: string
  ) => {
    setForm(
      (current) => ({
        ...current,
        floor: value,
        location: "",
      })
    );

    setLocations([]);

    if (!value) {
      return;
    }

    try {
      setLocations(
        await getLocations(
          Number(value)
        )
      );
    } catch {
      setError(
        "Impossible de charger les salles."
      );
    }
  };


  const submitCreate = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !form.code.trim()
      || !form.name.trim()
      || !form.category
      || !form.location
    ) {
      setError(
        "Complétez les champs obligatoires."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const created =
        await createEquipment({
          code:
            form.code.trim(),

          name:
            form.name.trim(),

          category:
            Number(
              form.category
            ),

          location:
            Number(
              form.location
            ),

          brand:
            form.brand.trim(),

          model_name:
            form.model_name.trim(),

          serial_number:
            form.serial_number.trim(),

          installation_date:
            form.installation_date
            || null,

          status:
            form.status,

          description:
            form.description.trim(),

          image:
            equipmentImage,
        });

      setForm(
        initialForm
      );

      setEquipmentImage(
        null
      );

      setShowCreate(
        false
      );

      navigate(
        `/equipment/${created.id}`
      );
    } catch {
      setError(
        "Impossible de créer l'équipement."
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="page-stack">

      <section className="hero-card equipment-hero">
        <div>
          <p className="eyebrow">
            PARC TECHNIQUE
          </p>

          <h2>
            Équipements
          </h2>

          <p className="muted">
            Inventoriez le parc,
            suivez l'état des équipements
            et leur historique.
          </p>
        </div>


        {canManage && (
          <div className="equipment-hero-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/equipment/archives"
                )
              }
            >
              Archives
            </button>


            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  "/equipment/qr-print"
                )
              }
            >
              Imprimer QR
            </button>


            {user?.role === "ADMIN" && (
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  navigate(
                    "/equipment/deletion-requests"
                  )
                }
              >
                Demandes de suppression
              </button>
            )}


            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowCreate(
                  (value) =>
                    !value
                )
              }
            >
              + Ajouter un équipement
            </button>
          </div>
        )}
      </section>


      <section className="analytics-stat-grid">
        <article className="analytics-stat-card">
          <span>
            Total
          </span>

          <strong>
            {stats.total}
          </strong>

          <small>
            Référencés
          </small>
        </article>

        <article className="analytics-stat-card">
          <span>
            Actifs
          </span>

          <strong>
            {stats.active}
          </strong>

          <small>
            En service
          </small>
        </article>

        <article className="analytics-stat-card">
          <span>
            Maintenance
          </span>

          <strong>
            {stats.maintenance}
          </strong>

          <small>
            En intervention
          </small>
        </article>

        <article className="analytics-stat-card">
          <span>
            Hors service
          </span>

          <strong>
            {stats.unavailable}
          </strong>

          <small>
            Indisponibles
          </small>
        </article>
      </section>


      {showCreate && canManage && (
        <form
          className="panel equipment-create-panel"
          onSubmit={submitCreate}
        >
          <div className="equipment-form-heading">
            <div>
              <p className="eyebrow">
                NOUVEL ÉQUIPEMENT
              </p>

              <h3>
                Ajouter au parc
              </h3>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setShowCreate(
                  false
                )
              }
            >
              Annuler
            </button>
          </div>


          <div className="equipment-form-grid">

            <label className="field">
              Code interne *

              <input
                value={
                  form.code
                }
                onChange={(event) =>
                  updateForm(
                    "code",
                    event.target.value
                  )
                }
                placeholder="CLIM-A-001"
              />
            </label>


            <label className="field">
              Nom *

              <input
                value={
                  form.name
                }
                onChange={(event) =>
                  updateForm(
                    "name",
                    event.target.value
                  )
                }
                placeholder="Climatiseur"
              />
            </label>


            <div className="field equipment-category-field">
              <span className="equipment-field-label">
                Catégorie *
              </span>

              <div className="equipment-category-select-row">
                <select
                  value={
                    form.category
                  }
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Choisir
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.icon
                        }{" "}
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  className="equipment-add-category-button"
                  onClick={() => {
                    setCategoryError("");

                    setShowCategoryCreate(
                      (current) =>
                        !current
                    );
                  }}
                  title="Créer une catégorie"
                >
                  +
                </button>
              </div>

              {!categories.length && (
                <small className="equipment-category-hint">
                  Aucune catégorie.
                  Cliquez sur + pour en créer une.
                </small>
              )}
            </div>


            <label className="field">
              État

              <select
                value={
                  form.status
                }
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (
                    value === "ACTIVE"
                    || value === "MAINTENANCE"
                    || value === "OUT_OF_SERVICE"
                  ) {
                    setForm(
                      (current) => ({
                        ...current,
                        status: value,
                      })
                    );
                  }
                }}
              >
                {Object.entries(
                  statusLabels
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>


            {showCategoryCreate && (
              <section className="equipment-category-create-box">
                <div className="equipment-category-create-heading">
                  <div>
                    <p className="eyebrow">
                      CATÉGORIE
                    </p>

                    <strong>
                      Nouvelle catégorie
                    </strong>
                  </div>

                  <button
                    type="button"
                    className="equipment-category-close"
                    onClick={() => {
                      setShowCategoryCreate(
                        false
                      );

                      setCategoryError("");
                    }}
                  >
                    ×
                  </button>
                </div>


                {categoryError && (
                  <div className="equipment-category-error">
                    {categoryError}
                  </div>
                )}


                <div className="equipment-category-create-grid">
                  <label className="field">
                    Nom *

                    <input
                      value={
                        categoryName
                      }
                      onChange={(event) =>
                        setCategoryName(
                          event.target.value
                        )
                      }
                      placeholder="Climatisation"
                    />
                  </label>


                  <label className="field">
                    Icône

                    <input
                      value={
                        categoryIcon
                      }
                      onChange={(event) =>
                        setCategoryIcon(
                          event.target.value
                        )
                      }
                      placeholder="❄️"
                      maxLength={10}
                    />
                  </label>


                  <label className="field equipment-category-description">
                    Description

                    <input
                      value={
                        categoryDescription
                      }
                      onChange={(event) =>
                        setCategoryDescription(
                          event.target.value
                        )
                      }
                      placeholder="Équipements de climatisation"
                    />
                  </label>
                </div>


                <div className="equipment-category-create-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowCategoryCreate(
                        false
                      );

                      setCategoryError("");
                    }}
                  >
                    Annuler
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      categorySaving
                    }
                    onClick={(event) =>
                      void createCategory(
                        event
                      )
                    }
                  >
                    {
                      categorySaving
                        ? "Création..."
                        : "Créer la catégorie"
                    }
                  </button>
                </div>
              </section>
            )}


            <label className="field">
              Site *

              <select
                value={
                  form.site
                }
                onChange={(event) =>
                  void selectSite(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Choisir
                </option>

                {sites.map(
                  (site) => (
                    <option
                      key={site.id}
                      value={site.id}
                    >
                      {site.name}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              Bâtiment *

              <select
                value={
                  form.building
                }
                disabled={
                  !form.site
                }
                onChange={(event) =>
                  void selectBuilding(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Choisir
                </option>

                {buildings.map(
                  (building) => (
                    <option
                      key={
                        building.id
                      }
                      value={
                        building.id
                      }
                    >
                      {
                        building.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              Étage *

              <select
                value={
                  form.floor
                }
                disabled={
                  !form.building
                }
                onChange={(event) =>
                  void selectFloor(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Choisir
                </option>

                {floors.map(
                  (floor) => (
                    <option
                      key={floor.id}
                      value={floor.id}
                    >
                      {floor.name}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              Salle / zone *

              <select
                value={
                  form.location
                }
                disabled={
                  !form.floor
                }
                onChange={(event) =>
                  updateForm(
                    "location",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Choisir
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={
                        location.id
                      }
                      value={
                        location.id
                      }
                    >
                      {
                        location.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              Marque

              <input
                value={
                  form.brand
                }
                onChange={(event) =>
                  updateForm(
                    "brand",
                    event.target.value
                  )
                }
              />
            </label>


            <label className="field">
              Modèle

              <input
                value={
                  form.model_name
                }
                onChange={(event) =>
                  updateForm(
                    "model_name",
                    event.target.value
                  )
                }
              />
            </label>


            <label className="field">
              N° de série

              <input
                value={
                  form.serial_number
                }
                onChange={(event) =>
                  updateForm(
                    "serial_number",
                    event.target.value
                  )
                }
              />
            </label>


            <label className="field">
              Installation

              <input
                type="date"
                value={
                  form.installation_date
                }
                onChange={(event) =>
                  updateForm(
                    "installation_date",
                    event.target.value
                  )
                }
              />
            </label>


            <div className="field equipment-full-field">
              <span className="equipment-field-label">
                Photo de l'équipement
              </span>

              <div className="equipment-image-upload">
                <div className="equipment-image-preview">
                  {equipmentImagePreview ? (
                    <img
                      src={
                        equipmentImagePreview
                      }
                      alt="Aperçu équipement"
                    />
                  ) : (
                    <span>
                      📷
                    </span>
                  )}
                </div>

                <div className="equipment-image-upload-actions">
                  <label className="secondary-button equipment-image-picker">
                    Choisir une photo

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file =
                          event.target
                            .files?.[0]
                          ?? null;

                        if (
                          file
                          && file.size
                          > 5
                            * 1024
                            * 1024
                        ) {
                          setError(
                            "La photo ne doit pas dépasser 5 Mo."
                          );

                          return;
                        }

                        setEquipmentImage(
                          file
                        );

                        event.target.value =
                          "";
                      }}
                    />
                  </label>

                  {equipmentImage && (
                    <button
                      type="button"
                      className="equipment-remove-image-button"
                      onClick={() =>
                        setEquipmentImage(
                          null
                        )
                      }
                    >
                      Retirer
                    </button>
                  )}

                  <small>
                    JPG, PNG, WEBP • 5 Mo max.
                  </small>
                </div>
              </div>
            </div>


            <label className="field equipment-full-field">
              Description

              <textarea
                rows={3}
                value={
                  form.description
                }
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value
                  )
                }
              />
            </label>

          </div>


          <div className="equipment-form-submit">
            <button
              className="primary-button"
              disabled={saving}
            >
              {
                saving
                  ? "Enregistrement..."
                  : "Créer l'équipement"
              }
            </button>
          </div>
        </form>
      )}


      <section className="panel">
        <form
          className="equipment-filter-bar"
          onSubmit={(event) => {
            event.preventDefault();

            void load();
          }}
        >
          <input
            type="search"
            value={
              search
            }
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Code, nom, marque, numéro de série..."
          />

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              Tous les états
            </option>

            {Object.entries(
              statusLabels
            ).map(
              ([
                value,
                label,
              ]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
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
        <section className="equipment-grid">

          {equipment.map(
            (item) => (
              <button
                type="button"
                className="equipment-card"
                key={item.id}
                onClick={() =>
                  navigate(
                    `/equipment/${item.id}`
                  )
                }
              >
                <div className="equipment-card-icon equipment-card-media">
                  {item.image_url ? (
                    <img
                      src={
                        item.image_url
                      }
                      alt={
                        item.name
                      }
                    />
                  ) : (
                    <span>
                      {
                        item.category_icon
                        || "🔧"
                      }
                    </span>
                  )}
                </div>

                <div className="equipment-card-content">
                  <div className="equipment-card-top">
                    <span className="incident-reference">
                      {
                        item.code
                      }
                    </span>

                    <span
                      className={
                        `equipment-status equipment-status-${item.status.toLowerCase()}`
                      }
                    >
                      {
                        item.status_label
                      }
                    </span>
                  </div>

                  <h3>
                    {
                      item.name
                    }
                  </h3>

                  <p>
                    {
                      item.category_name
                    }
                  </p>

                  <small>
                    📍{" "}
                    {
                      item.site_name
                    }
                    {" • "}
                    {
                      item.building_name
                    }
                    {" • "}
                    {
                      item.location_name
                    }
                  </small>

                  {(
                    item.brand
                    || item.model_name
                  ) && (
                    <span className="equipment-model">
                      {
                        [
                          item.brand,
                          item.model_name,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(" ")
                      }
                    </span>
                  )}
                </div>
              </button>
            )
          )}


          {!equipment.length && (
            <article className="panel incident-empty equipment-empty">
              <span>
                🧰
              </span>

              <h3>
                Aucun équipement
              </h3>

              <p className="muted">
                Ajoutez le premier
                équipement du parc.
              </p>
            </article>
          )}

        </section>
      )}

    </div>
  );
}
