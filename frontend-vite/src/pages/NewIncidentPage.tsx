import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createIncident,
  getIncidentCategories,
} from "../api/incidents";

import {
  getBuildings,
  getFloors,
  getLocations,
  getSites,
} from "../api/locations";

import type {
  IncidentCategory,
  IncidentPriority,
} from "../types/incident";

import type {
  Building,
  Floor,
  Location,
  Site,
} from "../types/location";


const MAX_IMAGES = 5;
const MAX_SIZE = 5 * 1024 * 1024;


export default function NewIncidentPage() {
  const navigate = useNavigate();


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
    category,
    setCategory,
  ] = useState("");

  const [
    site,
    setSite,
  ] = useState("");

  const [
    building,
    setBuilding,
  ] = useState("");

  const [
    floor,
    setFloor,
  ] = useState("");

  const [
    location,
    setLocation,
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
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


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
          "Impossible de charger le formulaire."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  const imagePreviews =
    useMemo(
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
      imagePreviews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview.url
          );
        }
      );
    };
  }, [imagePreviews]);


  const addFiles = (
    incomingFiles: File[]
  ) => {
    setError("");


    const validFiles =
      incomingFiles.filter(
        (file) => {
          if (
            !file.type.startsWith(
              "image/"
            )
          ) {
            return false;
          }

          if (
            file.size > MAX_SIZE
          ) {
            setError(
              `${file.name} dépasse 5 Mo.`
            );

            return false;
          }

          return true;
        }
      );


    setImages(
      (current) => {
        const combined = [
          ...current,
          ...validFiles,
        ];

        if (
          combined.length
          > MAX_IMAGES
        ) {
          setError(
            "Vous pouvez ajouter maximum 5 images."
          );
        }

        return combined.slice(
          0,
          MAX_IMAGES
        );
      }
    );
  };


  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    addFiles(files);

    event.target.value = "";
  };


  const handleDrop = (
    event: DragEvent
  ) => {
    event.preventDefault();

    addFiles(
      Array.from(
        event.dataTransfer.files
      )
    );
  };


  const selectSite = async (
    value: string
  ) => {
    setSite(value);

    setBuilding("");
    setFloor("");
    setLocation("");

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
      setBuilding(value);

      setFloor("");
      setLocation("");

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
    setFloor(value);

    setLocation("");

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


  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");


    if (
      !category
      || !location
      || !title.trim()
      || !description.trim()
    ) {
      setError(
        "Complétez tous les champs obligatoires."
      );

      return;
    }


    setSubmitting(true);


    try {
      const result =
        await createIncident({
          category:
            Number(category),

          location:
            Number(location),

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
        "Impossible d'envoyer le signalement."
      );
    } finally {
      setSubmitting(false);
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
    <div className="incident-form-page">

      <section className="incident-form-heading">
        <div>
          <p className="eyebrow">
            NOUVEAU SIGNALEMENT
          </p>

          <h2>
            Signaler un incident
          </h2>

          <p className="muted">
            Décrivez le problème et
            indiquez précisément où
            il se trouve.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            navigate(
              "/incidents"
            )
          }
        >
          Annuler
        </button>
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

        <div className="incident-form-main">

          <section className="panel">
            <p className="eyebrow">
              1 — PROBLÈME
            </p>

            <h3>
              Que s'est-il passé ?
            </h3>


            <div className="incident-form-fields">

              <label className="field">
                Catégorie *

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
                    Sélectionner
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.icon
                          ? `${item.icon} `
                          : ""}
                        {item.name}
                      </option>
                    )
                  )}
                </select>
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
                  maxLength={180}
                  placeholder="Ex. Climatisation en panne"
                  required
                />
              </label>


              <label className="field">
                Description *

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={6}
                  placeholder="Expliquez ce que vous avez constaté..."
                  required
                />
              </label>

            </div>
          </section>


          <section className="panel">
            <p className="eyebrow">
              2 — EMPLACEMENT
            </p>

            <h3>
              Où se trouve
              l'incident ?
            </h3>


            <div className="incident-location-grid">

              <label className="field">
                Site *

                <select
                  value={site}
                  onChange={(event) =>
                    selectSite(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Choisir un site
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
              </label>


              <label className="field">
                Bâtiment *

                <select
                  value={building}
                  onChange={(event) =>
                    selectBuilding(
                      event.target.value
                    )
                  }
                  disabled={!site}
                  required
                >
                  <option value="">
                    Choisir un bâtiment
                  </option>

                  {buildings.map(
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
              </label>


              <label className="field">
                Étage *

                <select
                  value={floor}
                  onChange={(event) =>
                    selectFloor(
                      event.target.value
                    )
                  }
                  disabled={!building}
                  required
                >
                  <option value="">
                    Choisir un étage
                  </option>

                  {floors.map(
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
              </label>


              <label className="field">
                Salle / zone *

                <select
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  disabled={!floor}
                  required
                >
                  <option value="">
                    Choisir un lieu
                  </option>

                  {locations.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                        {item.code
                          ? ` (${item.code})`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </label>

            </div>
          </section>


          <section className="panel">
            <p className="eyebrow">
              3 — PHOTOS
            </p>

            <h3>
              Ajouter des preuves
            </h3>

            <p className="muted">
              Maximum 5 images,
              5 Mo par image.
            </p>


            <label
              className="incident-dropzone"
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleFileChange
                }
              />

              <div className="dropzone-icon">
                📷
              </div>

              <strong>
                Ajouter des photos
              </strong>

              <span>
                Cliquez ou glissez
                vos images ici
              </span>
            </label>


            {!!imagePreviews.length && (
              <div className="incident-image-previews">
                {imagePreviews.map(
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
                        src={preview.url}
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

        </div>


        <aside className="incident-form-sidebar">

          <section className="panel sticky-panel">

            <p className="eyebrow">
              PRIORITÉ
            </p>

            <h3>
              Estimation d'urgence
            </h3>

            <p className="muted">
              Le responsable pourra
              confirmer cette priorité.
            </p>


            <div className="priority-options">

              <label>
                <input
                  type="radio"
                  name="priority"
                  value="LOW"
                  checked={
                    priority === "LOW"
                  }
                  onChange={() =>
                    setPriority("LOW")
                  }
                />

                <span>
                  <strong>
                    🟢 Faible
                  </strong>

                  <small>
                    Peut attendre
                  </small>
                </span>
              </label>


              <label>
                <input
                  type="radio"
                  name="priority"
                  value="NORMAL"
                  checked={
                    priority
                    === "NORMAL"
                  }
                  onChange={() =>
                    setPriority(
                      "NORMAL"
                    )
                  }
                />

                <span>
                  <strong>
                    🔵 Normale
                  </strong>

                  <small>
                    À traiter normalement
                  </small>
                </span>
              </label>


              <label>
                <input
                  type="radio"
                  name="priority"
                  value="HIGH"
                  checked={
                    priority === "HIGH"
                  }
                  onChange={() =>
                    setPriority("HIGH")
                  }
                />

                <span>
                  <strong>
                    🟠 Haute
                  </strong>

                  <small>
                    Intervention rapide
                  </small>
                </span>
              </label>


              <label>
                <input
                  type="radio"
                  name="priority"
                  value="CRITICAL"
                  checked={
                    priority
                    === "CRITICAL"
                  }
                  onChange={() =>
                    setPriority(
                      "CRITICAL"
                    )
                  }
                />

                <span>
                  <strong>
                    🔴 Critique
                  </strong>

                  <small>
                    Risque important
                  </small>
                </span>
              </label>

            </div>


            <button
              type="submit"
              className="primary-button incident-submit"
              disabled={submitting}
            >
              {submitting
                ? "Envoi..."
                : "Signaler l'incident"}
            </button>

          </section>

        </aside>

      </form>

    </div>
  );
}