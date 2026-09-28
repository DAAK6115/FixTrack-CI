import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../api/client";

import {
  getEquipmentAudit,
  getPendingEquipmentDeletion,
  requestEquipmentDeletion,
  getEquipmentCategories,
  getEquipmentIncidents,
  getEquipmentItem,
  getEquipmentQrUrl,
  updateEquipmentWithJustification,
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
  EquipmentAuditLog,
  EquipmentCategory,
  EquipmentDeletionRequest,
  EquipmentStatus,
} from "../types/equipment";

import type {
  IncidentListItem,
} from "../types/incident";

import type {
  Building,
  Floor,
  Location,
  Site,
} from "../types/location";


type EditForm = {
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
  notes: string;
};


export default function EquipmentDetailPage() {
  const {
    id,
  } = useParams();

  const navigate = useNavigate();

  const {
    user,
  } = useAuth();


  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment | null
  >(null);

  const [
    incidents,
    setIncidents,
  ] = useState<
    IncidentListItem[]
  >([]);

  const [
    auditLogs,
    setAuditLogs,
  ] = useState<
    EquipmentAuditLog[]
  >([]);


  const [
    pendingDeletion,
    setPendingDeletion,
  ] = useState<
    EquipmentDeletionRequest
    | null
  >(null);

  const [
    qrUrl,
    setQrUrl,
  ] = useState("");


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
    editMode,
    setEditMode,
  ] = useState(false);

  const [
    deleteMode,
    setDeleteMode,
  ] = useState(false);


  const [
    editForm,
    setEditForm,
  ] = useState<
    EditForm | null
  >(null);

  const [
    editImage,
    setEditImage,
  ] = useState<
    File | null
  >(null);

  const [
    editImagePreview,
    setEditImagePreview,
  ] = useState("");

  const [
    removeImage,
    setRemoveImage,
  ] = useState(false);

  const [
    editJustification,
    setEditJustification,
  ] = useState("");

  const [
    deleteJustification,
    setDeleteJustification,
  ] = useState("");


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


  const canManage =
    user?.role === "ADMIN"
    || user?.role === "MANAGER";


  const loadEquipment =
    async (
      equipmentId: number
    ) => {
      const [
        equipmentData,
        incidentsData,
      ] = await Promise.all([
        getEquipmentItem(
          equipmentId
        ),

        getEquipmentIncidents(
          equipmentId
        ),
      ]);

      setEquipment(
        equipmentData
      );

      setIncidents(
        incidentsData
      );


      if (canManage) {
        try {
          setAuditLogs(
            await getEquipmentAudit(
              equipmentId
            )
          );
        } catch {
          setAuditLogs([]);
        }

        try {
          const pending =
            await getPendingEquipmentDeletion(
              equipmentId
            );

          setPendingDeletion(
            pending.request
          );
        } catch {
          setPendingDeletion(
            null
          );
        }
      }


      return equipmentData;
    };


  useEffect(() => {
    if (!id) {
      return;
    }

    const equipmentId =
      Number(id);

    let objectUrl = "";

    Promise.all([
      loadEquipment(
        equipmentId
      ),
      getEquipmentCategories(),
      getSites(),
    ])
      .then(
        ([
          equipmentData,
          categoriesData,
          sitesData,
        ]) => {
          setCategories(
            categoriesData
          );

          setSites(
            sitesData
          );

          setEditForm({
            code:
              equipmentData.code,

            name:
              equipmentData.name,

            category:
              String(
                equipmentData.category
              ),

            site: "",
            building: "",
            floor: "",
            location:
              String(
                equipmentData.location
              ),

            brand:
              equipmentData.brand,

            model_name:
              equipmentData.model_name,

            serial_number:
              equipmentData.serial_number,

            installation_date:
              equipmentData.installation_date
              || "",

            status:
              equipmentData.status,

            description:
              equipmentData.description,

            notes:
              equipmentData.notes,
          });
        }
      )
      .catch(() => {
        setError(
          "Impossible de charger l'équipement."
        );
      })
      .finally(() => {
        setLoading(false);
      });


    api.get(
      getEquipmentQrUrl(
        equipmentId
      ),
      {
        responseType:
          "blob",
      }
    )
      .then(
        (response) => {
          objectUrl =
            URL.createObjectURL(
              response.data
            );

          setQrUrl(
            objectUrl
          );
        }
      )
      .catch(() => {
        // La fiche reste utilisable
        // sans le QR.
      });


    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(
          objectUrl
        );
      }
    };
  }, [
    id,
    canManage,
  ]);


  useEffect(() => {
    if (!editImage) {
      setEditImagePreview(
        ""
      );

      return;
    }

    const objectUrl =
      URL.createObjectURL(
        editImage
      );

    setEditImagePreview(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [
    editImage,
  ]);


  const initializeLocationSelectors =
    async () => {
      if (
        !equipment
        || !editForm
      ) {
        return;
      }

      const site =
        sites.find(
          (item) =>
            item.name
            === equipment.site_name
        );

      if (!site) {
        return;
      }

      const buildingData =
        await getBuildings(
          site.id
        );

      setBuildings(
        buildingData
      );

      const building =
        buildingData.find(
          (item) =>
            item.name
            === equipment
              .building_name
        );

      if (!building) {
        return;
      }

      const floorData =
        await getFloors(
          building.id
        );

      setFloors(
        floorData
      );

      const floor =
        floorData.find(
          (item) =>
            item.name
            === equipment.floor_name
        );

      if (!floor) {
        return;
      }

      const locationData =
        await getLocations(
          floor.id
        );

      setLocations(
        locationData
      );

      setEditForm(
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            site:
              String(
                site.id
              ),

            building:
              String(
                building.id
              ),

            floor:
              String(
                floor.id
              ),

            location:
              String(
                equipment.location
              ),
          };
        }
      );
    };


  const openEdit = () => {
    setError("");
    setDeleteMode(false);
    setEditMode(true);
    setEditJustification("");
    setEditImage(null);
    setRemoveImage(false);

    void initializeLocationSelectors();
  };


  const selectSite = async (
    value: string
  ) => {
    setEditForm(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          site: value,
          building: "",
          floor: "",
          location: "",
        };
      }
    );

    setBuildings([]);
    setFloors([]);
    setLocations([]);

    if (!value) {
      return;
    }

    setBuildings(
      await getBuildings(
        Number(value)
      )
    );
  };


  const selectBuilding =
    async (
      value: string
    ) => {
      setEditForm(
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            building: value,
            floor: "",
            location: "",
          };
        }
      );

      setFloors([]);
      setLocations([]);

      if (!value) {
        return;
      }

      setFloors(
        await getFloors(
          Number(value)
        )
      );
    };


  const selectFloor = async (
    value: string
  ) => {
    setEditForm(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          floor: value,
          location: "",
        };
      }
    );

    setLocations([]);

    if (!value) {
      return;
    }

    setLocations(
      await getLocations(
        Number(value)
      )
    );
  };


  const submitEdit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !equipment
      || !editForm
    ) {
      return;
    }

    if (
      editJustification
        .trim()
        .length
      < 5
    ) {
      setError(
        "Le justificatif de modification est obligatoire."
      );

      return;
    }

    if (
      !editForm.code.trim()
      || !editForm.name.trim()
      || !editForm.category
      || !editForm.location
    ) {
      setError(
        "Complétez les champs obligatoires."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        await updateEquipmentWithJustification(
          equipment.id,
          {
            code:
              editForm.code.trim(),

            name:
              editForm.name.trim(),

            category:
              Number(
                editForm.category
              ),

            location:
              Number(
                editForm.location
              ),

            brand:
              editForm.brand.trim(),

            model_name:
              editForm.model_name.trim(),

            serial_number:
              editForm.serial_number.trim(),

            installation_date:
              editForm.installation_date
              || null,

            status:
              editForm.status,

            description:
              editForm.description.trim(),

            notes:
              editForm.notes.trim(),

            image:
              editImage,
          },
          editJustification.trim(),
          removeImage
        );

      setEquipment(
        updated
      );

      setEditMode(false);
      setEditJustification("");
      setEditImage(null);
      setRemoveImage(false);

      setAuditLogs(
        await getEquipmentAudit(
          equipment.id
        )
      );
    } catch {
      setError(
        "Impossible de modifier l'équipement."
      );
    } finally {
      setSaving(false);
    }
  };


  const submitDelete = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (!equipment) {
      return;
    }

    if (
      deleteJustification
        .trim()
        .length
      < 5
    ) {
      setError(
        "Le justificatif de suppression est obligatoire."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const deletionRequest =
        await requestEquipmentDeletion(
          equipment.id,
          deleteJustification.trim()
        );

      setPendingDeletion(
        deletionRequest
      );

      setDeleteMode(false);
      setDeleteJustification("");
    } catch {
      setError(
        "Impossible d'envoyer la demande de suppression."
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

      <section className="equipment-detail-hero">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() =>
              navigate(
                "/equipment"
              )
            }
          >
            ← Équipements
          </button>

          <div className="equipment-detail-title">

            <div className="equipment-detail-photo">
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
                {equipment.code}
              </p>

              <h2>
                {equipment.name}
              </h2>

              <span
                className={
                  equipment.is_active
                    ? (
                        `equipment-status equipment-status-${equipment.status.toLowerCase()}`
                      )
                    : (
                        "equipment-status equipment-status-archived"
                      )
                }
              >
                {
                  equipment.is_active
                    ? equipment.status_label
                    : "Archivé"
                }
              </span>
            </div>
          </div>
        </div>


        <div className="equipment-detail-actions">
          {equipment.is_active && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate(
                  `/equipment/${equipment.id}/report`
                )
              }
            >
              + Signaler une panne
            </button>
          )}

          {canManage
            && equipment.is_active
            && (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={
                  openEdit
                }
              >
                Modifier
              </button>

              {user?.role === "MANAGER" && (
                <button
                  type="button"
                  className="equipment-danger-button"
                  disabled={
                    Boolean(
                      pendingDeletion
                    )
                  }
                  onClick={() => {
                    setEditMode(false);
                    setDeleteMode(true);
                    setError("");
                  }}
                >
                  {
                    pendingDeletion
                      ? "Suppression en attente"
                      : "Demander la suppression"
                  }
                </button>
              )}

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
                  Gérer les suppressions
                </button>
              )}
            </>
          )}
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {!equipment.is_active && (
        <section className="panel equipment-archived-notice">
          <div>
            <p className="eyebrow">
              ÉQUIPEMENT ARCHIVÉ
            </p>

            <h3>
              Cet équipement a été retiré du parc.
            </h3>

            <p className="muted">
              Sa fiche reste consultable afin de conserver
              son historique, ses incidents et ses justificatifs.
            </p>
          </div>
        </section>
      )}


      {pendingDeletion && (
        <section className="panel equipment-pending-deletion">
          <div>
            <p className="eyebrow">
              SUPPRESSION EN ATTENTE
            </p>

            <h3>
              Demande de suppression en attente
              de validation par l'administrateur
            </h3>

            <p>
              <strong>
                Justification :
              </strong>{" "}
              {
                pendingDeletion
                  .justification
              }
            </p>

            <small>
              Demandée par{" "}
              {
                pendingDeletion
                  .requested_by_name
                || pendingDeletion
                  .requested_by_email
              }
              {" • "}
              {new Date(
                pendingDeletion
                  .requested_at
              ).toLocaleString(
                "fr-FR"
              )}
            </small>
          </div>
        </section>
      )}


      {editMode
        && canManage
        && editForm
        && (
          <form
            className="panel equipment-edit-panel"
            onSubmit={submitEdit}
          >
            <div className="equipment-form-heading">
              <div>
                <p className="eyebrow">
                  MODIFICATION
                </p>

                <h3>
                  Modifier l'équipement
                </h3>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setEditMode(
                    false
                  )
                }
              >
                Annuler
              </button>
            </div>


            <div className="equipment-form-grid">

              <label className="field">
                Code *

                <input
                  value={
                    editForm.code
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        code:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field">
                Nom *

                <input
                  value={
                    editForm.name
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        name:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field">
                Catégorie *

                <select
                  value={
                    editForm.category
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        category:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                >
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
              </label>


              <label className="field">
                État

                <select
                  value={
                    editForm.status
                  }
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    if (
                      value === "ACTIVE"
                      || value === "MAINTENANCE"
                      || value === "OUT_OF_SERVICE"
                    ) {
                      setEditForm(
                        {
                          ...editForm,
                          status:
                            value,
                        }
                      );
                    }
                  }}
                >
                  <option value="ACTIVE">
                    Actif
                  </option>

                  <option value="MAINTENANCE">
                    En maintenance
                  </option>

                  <option value="OUT_OF_SERVICE">
                    Hors service
                  </option>
                </select>
              </label>


              <label className="field">
                Site *

                <select
                  value={
                    editForm.site
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
                    editForm.building
                  }
                  disabled={
                    !editForm.site
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
                    editForm.floor
                  }
                  disabled={
                    !editForm.building
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
                    editForm.location
                  }
                  disabled={
                    !editForm.floor
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        location:
                          event
                            .target
                            .value,
                      }
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
                    editForm.brand
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        brand:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field">
                Modèle

                <input
                  value={
                    editForm.model_name
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        model_name:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field">
                N° de série

                <input
                  value={
                    editForm.serial_number
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        serial_number:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field">
                Installation

                <input
                  type="date"
                  value={
                    editForm.installation_date
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        installation_date:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <div className="field equipment-full-field">
                <span className="equipment-field-label">
                  Photo
                </span>

                <div className="equipment-image-upload">
                  <div className="equipment-image-preview">
                    {(
                      editImagePreview
                      || (
                        !removeImage
                        && equipment.image_url
                      )
                    ) ? (
                      <img
                        src={
                          editImagePreview
                          || equipment.image_url
                          || ""
                        }
                        alt="Équipement"
                      />
                    ) : (
                      <span>
                        📷
                      </span>
                    )}
                  </div>

                  <div className="equipment-image-upload-actions">
                    <label className="secondary-button equipment-image-picker">
                      Changer la photo

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

                          setEditImage(
                            file
                          );

                          setRemoveImage(
                            false
                          );

                          event.target.value =
                            "";
                        }}
                      />
                    </label>

                    {(
                      editImage
                      || equipment.image_url
                    ) && (
                      <button
                        type="button"
                        className="equipment-remove-image-button"
                        onClick={() => {
                          setEditImage(
                            null
                          );

                          setRemoveImage(
                            true
                          );
                        }}
                      >
                        Supprimer la photo
                      </button>
                    )}
                  </div>
                </div>
              </div>


              <label className="field equipment-full-field">
                Description

                <textarea
                  rows={3}
                  value={
                    editForm.description
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        description:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field equipment-full-field">
                Notes internes

                <textarea
                  rows={3}
                  value={
                    editForm.notes
                  }
                  onChange={(event) =>
                    setEditForm(
                      {
                        ...editForm,
                        notes:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                />
              </label>


              <label className="field equipment-full-field equipment-justification-field">
                Justificatif de modification *

                <textarea
                  rows={4}
                  value={
                    editJustification
                  }
                  onChange={(event) =>
                    setEditJustification(
                      event.target.value
                    )
                  }
                  placeholder="Ex. Correction du numéro de série après vérification physique..."
                  required
                />

                <small>
                  Ce justificatif sera conservé
                  dans l'historique d'audit.
                </small>
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
                    : "Enregistrer les modifications"
                }
              </button>
            </div>
          </form>
        )}


      {deleteMode
        && user?.role === "MANAGER"
        && (
          <form
            className="panel equipment-delete-panel"
            onSubmit={submitDelete}
          >
            <div>
              <p className="eyebrow">
                SUPPRESSION
              </p>

              <h3>
                Demander la suppression
              </h3>

              <p className="muted">
                L'équipement ne sera pas supprimé
                immédiatement. Un administrateur
                devra valider ou refuser la demande.
              </p>
            </div>


            <label className="field">
              Justificatif obligatoire *

              <textarea
                rows={4}
                value={
                  deleteJustification
                }
                onChange={(event) =>
                  setDeleteJustification(
                    event.target.value
                  )
                }
                placeholder="Ex. Équipement irréparable et remplacé par une nouvelle unité..."
                required
              />
            </label>


            <div className="equipment-delete-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDeleteMode(
                    false
                  )
                }
              >
                Annuler
              </button>

              <button
                type="submit"
                className="equipment-danger-button"
                disabled={saving}
              >
                {
                  saving
                    ? "Suppression..."
                    : "Envoyer la demande"
                }
              </button>
            </div>
          </form>
        )}


      <div className="equipment-detail-layout">

        <main className="equipment-detail-main">

          <section className="panel">
            <p className="eyebrow">
              INFORMATIONS TECHNIQUES
            </p>

            <div className="equipment-info-grid">

              <div>
                <span>
                  Catégorie
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
                  Marque
                </span>

                <strong>
                  {
                    equipment.brand
                    || "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Modèle
                </span>

                <strong>
                  {
                    equipment.model_name
                    || "—"
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
                    || "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Installation
                </span>

                <strong>
                  {
                    equipment
                      .installation_date
                    ? new Date(
                        equipment
                          .installation_date
                      ).toLocaleDateString(
                        "fr-FR"
                      )
                    : "—"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Code
                </span>

                <strong>
                  {equipment.code}
                </strong>
              </div>

            </div>


            {equipment.description && (
              <div className="equipment-description">
                <span>
                  Description
                </span>

                <p>
                  {
                    equipment.description
                  }
                </p>
              </div>
            )}
          </section>


          <section className="panel">
            <div className="analytics-section-heading">
              <div>
                <p className="eyebrow">
                  MAINTENANCE
                </p>

                <h3>
                  Historique des incidents
                </h3>
              </div>
            </div>


            <div className="analytics-recent-list">
              {incidents.map(
                (incident) => (
                  <button
                    type="button"
                    className="analytics-recent-row"
                    key={
                      incident.id
                    }
                    onClick={() =>
                      navigate(
                        `/incidents/${incident.id}`
                      )
                    }
                  >
                    <div>
                      <span className="incident-reference">
                        {
                          incident.reference
                        }
                      </span>

                      <strong>
                        {
                          incident.title
                        }
                      </strong>

                      <small>
                        {
                          incident
                            .category_name
                        }
                        {" • "}
                        {new Date(
                          incident.reported_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}
                      </small>
                    </div>

                    <span
                      className={
                        `incident-status status-${incident.status.toLowerCase()}`
                      }
                    >
                      {
                        incident
                          .status_label
                      }
                    </span>

                    <span className="analytics-row-arrow">
                      →
                    </span>
                  </button>
                )
              )}


              {!incidents.length && (
                <div className="analytics-empty">
                  Aucun incident lié
                  à cet équipement.
                </div>
              )}
            </div>
          </section>


          {canManage && (
            <section className="panel">
              <div className="analytics-section-heading">
                <div>
                  <p className="eyebrow">
                    AUDIT
                  </p>

                  <h3>
                    Historique des modifications
                  </h3>
                </div>
              </div>


              <div className="equipment-audit-list">
                {auditLogs.map(
                  (log) => (
                    <article
                      className="equipment-audit-row"
                      key={log.id}
                    >
                      <div className={
                        log.action
                        === "DELETE"
                          ? "equipment-audit-icon delete"
                          : "equipment-audit-icon"
                      }>
                        {
                          log.action
                          === "DELETE"
                            ? "🗑️"
                            : "✏️"
                        }
                      </div>

                      <div>
                        <div className="equipment-audit-heading">
                          <strong>
                            {
                              log.action_label
                            }
                          </strong>

                          <span>
                            {new Date(
                              log.created_at
                            ).toLocaleString(
                              "fr-FR"
                            )}
                          </span>
                        </div>

                        <p>
                          {
                            log.justification
                          }
                        </p>

                        <small>
                          Par{" "}
                          {
                            log.performed_by_name
                            || log.performed_by_email
                          }
                        </small>
                      </div>
                    </article>
                  )
                )}


                {!auditLogs.length && (
                  <div className="analytics-empty">
                    Aucune modification
                    enregistrée.
                  </div>
                )}
              </div>
            </section>
          )}

        </main>


        <aside className="equipment-detail-sidebar">

          <section className="panel equipment-location-card">
            <p className="eyebrow">
              LOCALISATION
            </p>

            <strong>
              📍{" "}
              {equipment.site_name}
            </strong>

            <span>
              {
                equipment
                  .building_name
              }
            </span>

            <span>
              {
                equipment.floor_name
              }
            </span>

            <span>
              {
                equipment.location_name
              }
            </span>

            {equipment.site_address && (
              <small>
                {
                  equipment
                    .site_address
                }
              </small>
            )}
          </section>


          <section className="panel equipment-qr-card">
            <p className="eyebrow">
              QR CODE
            </p>

            <h3>
              Identification rapide
            </h3>

            <p className="muted">
              Le QR ouvre directement
              cette fiche équipement.
            </p>


            {qrUrl ? (
              <img
                className="equipment-qr-image"
                src={qrUrl}
                alt={
                  `QR Code ${equipment.code}`
                }
              />
            ) : (
              <div className="equipment-qr-placeholder">
                QR indisponible
              </div>
            )}


            <small className="equipment-qr-token">
              {
                equipment.qr_token
              }
            </small>
          </section>

        </aside>

      </div>

    </div>
  );
}
