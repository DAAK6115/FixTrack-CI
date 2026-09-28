import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createIncident,
  getIncidentCategories,
} from "../api/incidents";

import {
  getEquipmentItem,
} from "../api/equipment";

import type {
  Equipment,
} from "../types/equipment";

import type {
  IncidentCategory,
  IncidentPriority,
} from "../types/incident";


const MAX_IMAGES = 5;
const MAX_SIZE =
  5 * 1024 * 1024;



function normalizeCategoryName(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase(
      "fr"
    );
}


function equipmentModelLabel(
  brand: string,
  modelName: string
) {
  const values = [
    brand,
    modelName,
  ].filter(
    Boolean
  );

  return values.length
    ? values.join(" ")
    : "Non renseigné";
}


export default function EquipmentIncidentPage() {
  const {
    id,
  } = useParams();

  const navigate = useNavigate();


  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment | null
  >(null);

  const [
    categories,
    setCategories,
  ] = useState<
    IncidentCategory[]
  >([]);

  const [
    category,
    setCategory,
  ] = useState("");

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState<IncidentPriority>(
    "NORMAL"
  );

  const [
    images,
    setImages,
  ] = useState<File[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    if (!id) {
      return;
    }

    Promise.all([
      getEquipmentItem(
        Number(id)
      ),
      getIncidentCategories(),
    ])
      .then(
        ([
          equipmentData,
          categoriesData,
        ]) => {
          setEquipment(
            equipmentData
          );

          setCategories(
            categoriesData
          );

          const equipmentCategoryName =
            normalizeCategoryName(
              equipmentData
                .category_name
            );

          const matchingCategory =
            categoriesData.find(
              (item) =>
                normalizeCategoryName(
                  item.name
                )
                === equipmentCategoryName
            );

          if (matchingCategory) {
            setCategory(
              String(
                matchingCategory.id
              )
            );
          }

          setTitle(
            `Panne - ${equipmentData.name}`
          );
        }
      )
      .catch(() => {
        setError(
          "Impossible de préparer le signalement."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);


  const previews = useMemo(
    () => (
      images.map(
        (file) => ({
          file,
          url:
            URL.createObjectURL(
              file
            ),
        })
      )
    ),
    [images]
  );


  useEffect(() => {
    return () => {
      previews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview.url
          );
        }
      );
    };
  }, [previews]);


  const handleFiles = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(
      event.target.files
      || []
    );

    const valid = selected.filter(
      (file) =>
        file.type.startsWith(
          "image/"
        )
        && file.size <= MAX_SIZE
    );

    setImages(
      (current) => [
        ...current,
        ...valid,
      ].slice(
        0,
        MAX_IMAGES
      )
    );

    event.target.value = "";
  };


  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !equipment
      || !category
      || !title.trim()
      || !description.trim()
    ) {
      setError(
        "Complétez les champs obligatoires."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const result =
        await createIncident({
          category:
            Number(category),

          location:
            equipment.location,

          equipment:
            equipment.id,

          title:
            title.trim(),

          description:
            description.trim(),

          requested_priority:
            priority,

          images,
        });

      navigate(
        `/incidents/${result.id}`
      );
    } catch {
      setError(
        "Impossible de créer le signalement."
      );
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <section className="panel">
        Chargement...
      </section>
    );
  }


  if (
    error
    && !equipment
  ) {
    return (
      <div className="error-box">
        {error}
      </div>
    );
  }


  if (!equipment) {
    return null;
  }


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                `/equipment/${equipment.id}`
              )
            }
          >
            ← Équipement
          </button>

          <p className="eyebrow">
            PANNE ÉQUIPEMENT
          </p>

          <h2>
            Signaler un problème
          </h2>

          <p className="muted">
            Le signalement sera
            automatiquement rattaché
            à cet équipement.
          </p>
        </div>
      </section>


      <section className="panel incident-equipment-banner equipment-prefill-banner">
        <div className="equipment-prefill-header">
          <div className="equipment-card-icon equipment-card-media">
            {equipment.image_url ? (
              <img
                src={
                  equipment.image_url
                }
                alt={
                  equipment.name
                }
              />
            ) : (
              <span>
                {
                  equipment.category_icon
                  || "🔧"
                }
              </span>
            )}
          </div>

          <div>
            <p className="eyebrow">
              ÉQUIPEMENT SÉLECTIONNÉ
            </p>

            <span className="incident-reference">
              {equipment.code}
            </span>

            <strong className="equipment-prefill-name">
              {equipment.name}
            </strong>

            <small>
              Toutes les informations techniques
              ci-dessous sont préremplies
              automatiquement.
            </small>
          </div>
        </div>


        <div className="equipment-prefill-grid">
          <div>
            <span>
              Catégorie équipement
            </span>

            <strong>
              {
                equipment.category_icon
              }{" "}
              {
                equipment.category_name
              }
            </strong>
          </div>

          <div>
            <span>
              Marque / modèle
            </span>

            <strong>
              {
                equipmentModelLabel(
                  equipment.brand,
                  equipment.model_name
                )
              }
            </strong>
          </div>

          <div>
            <span>
              N° de série
            </span>

            <strong>
              {
                equipment.serial_number
                || "Non renseigné"
              }
            </strong>
          </div>

          <div>
            <span>
              Site
            </span>

            <strong>
              {
                equipment.site_name
              }
            </strong>
          </div>

          <div>
            <span>
              Bâtiment
            </span>

            <strong>
              {
                equipment.building_name
              }
            </strong>
          </div>

          <div>
            <span>
              Étage
            </span>

            <strong>
              {
                equipment.floor_name
              }
            </strong>
          </div>

          <div>
            <span>
              Salle / zone
            </span>

            <strong>
              {
                equipment.location_name
              }
            </strong>
          </div>

          <div>
            <span>
              État équipement
            </span>

            <strong>
              {
                equipment.status_label
              }
            </strong>
          </div>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      <form
        className="incident-create-layout"
        onSubmit={submit}
      >

        <main className="incident-form-main">

          <section className="panel">
            <p className="eyebrow">
              PROBLÈME
            </p>

            <div className="incident-form-fields">

              <label className="field">
                Catégorie de l'incident *

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Choisir
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {
                          item.icon
                        }{" "}
                        {
                          item.name
                        }
                      </option>
                    )
                  )}
                </select>

                <small className="incident-prefill-hint">
                  {
                    category
                      ? (
                          "Préremplie automatiquement à partir "
                          + "de la catégorie de l'équipement. "
                          + "Vous pouvez la modifier si nécessaire."
                        )
                      : (
                          "Aucune catégorie d'incident correspondante "
                          + "n'a été trouvée automatiquement."
                        )
                  }
                </small>
              </label>


              <label className="field">
                Titre *

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value
                    )
                  }
                  required
                />

                <small className="incident-prefill-hint">
                  Généré automatiquement à partir
                  du nom de l'équipement.
                </small>
              </label>


              <label className="field">
                Description de la panne *

                <textarea
                  rows={7}
                  value={
                    description
                  }
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Décrivez uniquement la panne : symptômes, bruit, comportement anormal, circonstances..."
                  required
                />
              </label>

            </div>
          </section>


          <section className="panel">
            <p className="eyebrow">
              PHOTOS
            </p>

            <label className="incident-dropzone">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleFiles
                }
              />

              <div className="dropzone-icon">
                📷
              </div>

              <strong>
                Ajouter des photos
              </strong>

              <span>
                Maximum 5 images,
                5 Mo chacune
              </span>
            </label>


            {!!previews.length && (
              <div className="incident-image-previews">
                {previews.map(
                  (
                    preview,
                    index
                  ) => (
                    <div
                      className="incident-preview"
                      key={
                        `${preview.file.name}-${index}`
                      }
                    >
                      <img
                        src={
                          preview.url
                        }
                        alt=""
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setImages(
                            (current) =>
                              current.filter(
                                (
                                  _,
                                  currentIndex
                                ) =>
                                  currentIndex
                                  !== index
                              )
                          )
                        }
                      >
                        ×
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

        </main>


        <aside className="incident-form-sidebar">
          <section className="panel sticky-panel">

            <p className="eyebrow">
              PRIORITÉ
            </p>

            <div className="priority-options">
              {[
                [
                  "LOW",
                  "🟢 Faible",
                ],
                [
                  "NORMAL",
                  "🔵 Normale",
                ],
                [
                  "HIGH",
                  "🟠 Haute",
                ],
                [
                  "CRITICAL",
                  "🔴 Critique",
                ],
              ].map(
                (option) => {
                  const value =
                    option[0];

                  const label =
                    option[1];

                  return (
                    <label
                      key={value}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={value}
                        checked={
                          priority
                          === value
                        }
                        onChange={() => {
                          if (
                            value === "LOW"
                            || value === "NORMAL"
                            || value === "HIGH"
                            || value === "CRITICAL"
                          ) {
                            setPriority(
                              value
                            );
                          }
                        }}
                      />

                      <span>
                        <strong>
                          {label}
                        </strong>
                      </span>
                    </label>
                  );
                }
              )}
            </div>


            <button
              className="primary-button incident-submit"
              disabled={saving}
            >
              {
                saving
                  ? "Envoi..."
                  : "Signaler la panne"
              }
            </button>

          </section>
        </aside>

      </form>

    </div>
  );
}
