import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getCurrentOrganization,
  updateCurrentOrganization,
} from "../api/organization";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  Organization,
  OrganizationType,
} from "../types/organization";


const organizationTypes: Array<{
  value: OrganizationType;
  label: string;
}> = [
  {
    value: "SCHOOL",
    label: "Établissement scolaire",
  },
  {
    value: "COMPANY",
    label: "Entreprise",
  },
  {
    value: "HOTEL",
    label: "Hôtel",
  },
  {
    value: "RESIDENCE",
    label: "Résidence",
  },
  {
    value: "COMMERCIAL",
    label: "Espace commercial",
  },
  {
    value: "OTHER",
    label: "Autre",
  },
];


export default function SettingsPage() {
  const {
    reloadUser,
  } = useAuth();


  const [
    organization,
    setOrganization,
  ] = useState<
    Organization | null
  >(null);


  const [
    name,
    setName,
  ] = useState("");

  const [
    type,
    setType,
  ] = useState<
    OrganizationType
  >("OTHER");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");


  const [
    logoFile,
    setLogoFile,
  ] = useState<
    File | null
  >(null);

  const [
    logoPreview,
    setLogoPreview,
  ] = useState("");

  const [
    removeLogo,
    setRemoveLogo,
  ] = useState(false);


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

  const [
    success,
    setSuccess,
  ] = useState("");


  useEffect(() => {
    getCurrentOrganization()
      .then(
        (data) => {
          setOrganization(
            data
          );

          setName(
            data.name
          );

          setType(
            data.type
          );

          setEmail(
            data.email
          );

          setPhone(
            data.phone
          );

          setAddress(
            data.address
          );
        }
      )
      .catch(() => {
        setError(
          "Impossible de charger les paramètres de l'organisation."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(
        ""
      );

      return;
    }

    const objectUrl =
      URL.createObjectURL(
        logoFile
      );

    setLogoPreview(
      objectUrl
    );

    return () => {
      URL.revokeObjectURL(
        objectUrl
      );
    };
  }, [
    logoFile,
  ]);


  const selectLogo = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0]
      ?? null;

    event.target.value = "";

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Le fichier sélectionné doit être une image."
      );

      return;
    }

    if (
      file.size
      > 5
        * 1024
        * 1024
    ) {
      setError(
        "Le logo ne doit pas dépasser 5 Mo."
      );

      return;
    }

    setLogoFile(
      file
    );

    setRemoveLogo(
      false
    );

    setError("");
    setSuccess("");
  };


  const submit = async (
    event:
      FormEvent
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Le nom de l'organisation est obligatoire."
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated =
        await updateCurrentOrganization(
          {
            name:
              name.trim(),

            type,

            email:
              email.trim(),

            phone:
              phone.trim(),

            address:
              address.trim(),
          },
          logoFile,
          removeLogo
        );

      setOrganization(
        updated
      );

      setLogoFile(
        null
      );

      setRemoveLogo(
        false
      );

      await reloadUser();

      window.dispatchEvent(
        new CustomEvent(
          "fixtrack:organization-updated",
          {
            detail:
              updated,
          }
        )
      );

      setSuccess(
        "Les paramètres de l'organisation ont été enregistrés."
      );
    } catch {
      setError(
        "Impossible d'enregistrer les paramètres. Vérifiez les informations et le format du logo."
      );
    } finally {
      setSaving(false);
    }
  };


  const currentLogo =
    removeLogo
      ? ""
      : (
          logoPreview
          || organization
            ?.logo_url
          || ""
        );


  if (loading) {
    return (
      <section className="panel">
        Chargement...
      </section>
    );
  }


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <p className="eyebrow">
            ADMINISTRATION
          </p>

          <h2>
            Paramètres
          </h2>

          <p className="muted">
            Gérez l'identité de votre organisation
            et le logo utilisé notamment sur
            les étiquettes QR.
          </p>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {success && (
        <div className="settings-success-box">
          {success}
        </div>
      )}


      <form
        className="settings-layout"
        onSubmit={submit}
      >

        <main className="panel settings-main-panel">
          <div>
            <p className="eyebrow">
              ORGANISATION
            </p>

            <h3>
              Informations générales
            </h3>
          </div>


          <div className="settings-form-grid">

            <label className="field settings-full-field">
              Nom de l'organisation *

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                required
              />
            </label>


            <label className="field">
              Type

              <select
                value={type}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  const nextType =
                    organizationTypes.find(
                      (item) =>
                        item.value
                        === value
                    );

                  if (nextType) {
                    setType(
                      nextType.value
                    );
                  }
                }}
              >
                {organizationTypes.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              Téléphone

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="+225 ..."
              />
            </label>


            <label className="field settings-full-field">
              E-mail

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </label>


            <label className="field settings-full-field">
              Adresse

              <textarea
                rows={3}
                value={address}
                onChange={(event) =>
                  setAddress(
                    event.target.value
                  )
                }
              />
            </label>

          </div>
        </main>


        <aside className="panel settings-logo-panel">
          <div>
            <p className="eyebrow">
              IDENTITÉ VISUELLE
            </p>

            <h3>
              Logo de l'organisation
            </h3>

            <p className="muted">
              Ce logo sera utilisé sur
              l'impression des QR Codes
              lorsque « Logo entreprise »
              ou « Les deux » est sélectionné.
            </p>
          </div>


          <div className="settings-logo-preview">
            {currentLogo ? (
              <img
                src={
                  currentLogo
                }
                alt={
                  `Logo ${name}`
                }
              />
            ) : (
              <div className="settings-logo-placeholder">
                <span>
                  🏢
                </span>

                <strong>
                  Aucun logo
                </strong>

                <small>
                  PNG, JPG ou WEBP
                </small>
              </div>
            )}
          </div>


          <div className="settings-logo-actions">
            <label className="primary-button settings-logo-picker">
              {
                currentLogo
                  ? "Changer le logo"
                  : "Ajouter un logo"
              }

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/*"
                onChange={
                  selectLogo
                }
              />
            </label>


            {currentLogo && (
              <button
                type="button"
                className="settings-remove-logo"
                onClick={() => {
                  setLogoFile(
                    null
                  );

                  setRemoveLogo(
                    true
                  );

                  setSuccess("");
                }}
              >
                Supprimer le logo
              </button>
            )}


            {removeLogo && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setRemoveLogo(
                    false
                  );
                }}
              >
                Annuler la suppression
              </button>
            )}

            <small>
              Taille maximale : 5 Mo.
              Un fichier transparent PNG
              est recommandé.
            </small>
          </div>


          {organization && (
            <div className="settings-org-meta">
              <span>
                Identifiant
              </span>

              <strong>
                {
                  organization.slug
                }
              </strong>
            </div>
          )}
        </aside>


        <div className="settings-submit">
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {
              saving
                ? "Enregistrement..."
                : "Enregistrer les paramètres"
            }
          </button>
        </div>

      </form>

    </div>
  );
}
