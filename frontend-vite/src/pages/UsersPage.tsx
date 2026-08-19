import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createUser,
  deactivateUser,
  getUsers,
  updateUser,
} from "../api/users";

import type {
  ManagedUser,
} from "../types/user";

import type {
  UserRole,
} from "../types/auth";


const roleLabels: Record<
  UserRole,
  string
> = {
  ADMIN: "Administrateur",
  MANAGER: "Responsable",
  TECHNICIAN: "Technicien",
  REQUESTER: "Demandeur",
};


const emptyForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "REQUESTER" as UserRole,
  password: "",
  is_active: true,
};


export default function UsersPage() {
  const [
    users,
    setUsers,
  ] = useState<ManagedUser[]>([]);

  const [form, setForm] = useState(
    emptyForm
  );

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [error, setError] = useState("");


  const reload = async () => {
    setLoading(true);
    setError("");

    try {
      setUsers(
        await getUsers()
      );
    } catch {
      setError(
        "Impossible de charger les utilisateurs."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    reload();
  }, []);


  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    setError("");

    try {
      if (editingId) {
        await updateUser(
          editingId,
          {
            email: form.email,
            first_name:
              form.first_name,
            last_name:
              form.last_name,
            phone: form.phone,
            role: form.role,
            is_active:
              form.is_active,

            ...(form.password
              ? {
                  password:
                    form.password,
                }
              : {}),
          }
        );
      } else {
        await createUser({
          email: form.email,
          first_name:
            form.first_name,
          last_name:
            form.last_name,
          phone: form.phone,
          role: form.role,
          password:
            form.password,
          is_active: true,
        });
      }

      setForm(emptyForm);
      setEditingId(null);

      await reload();
    } catch {
      setError(
        "Impossible d'enregistrer l'utilisateur."
      );
    }
  };


  return (
    <div className="page-stack">

      <section className="hero-card">
        <div>
          <p className="eyebrow">
            ADMINISTRATION
          </p>

          <h2>Utilisateurs</h2>

          <p className="muted">
            Gérez les comptes, rôles et
            accès à FixTrack CI.
          </p>
        </div>

        <div className="summary-inline">
          <span>
            <strong>
              {users.length}
            </strong>
            utilisateurs
          </span>
        </div>
      </section>


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      <section className="user-layout">

        <article className="panel">
          <p className="eyebrow">
            {editingId
              ? "MODIFICATION"
              : "NOUVEL UTILISATEUR"}
          </p>

          <h3>
            {editingId
              ? "Modifier le compte"
              : "Créer un compte"}
          </h3>

          <form
            className="resource-form"
            onSubmit={submit}
          >
            <div className="form-two-columns">
              <label className="field">
                Prénom

                <input
                  value={
                    form.first_name
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      first_name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <label className="field">
                Nom

                <input
                  value={
                    form.last_name
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      last_name:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>

            <label className="field">
              Adresse e-mail

              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    email:
                      event.target.value,
                  })
                }
                required
              />
            </label>

            <label className="field">
              Téléphone

              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    phone:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="field">
              Rôle

              <select
                value={form.role}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role:
                      event.target
                        .value as UserRole,
                  })
                }
              >
                <option value="REQUESTER">
                  Demandeur
                </option>

                <option value="TECHNICIAN">
                  Technicien
                </option>

                <option value="MANAGER">
                  Responsable
                </option>

                <option value="ADMIN">
                  Administrateur
                </option>
              </select>
            </label>

            <label className="field">
              {editingId
                ? "Nouveau mot de passe"
                : "Mot de passe"}

              <input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password:
                      event.target.value,
                  })
                }
                required={!editingId}
                minLength={8}
              />
            </label>

            {editingId && (
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={
                    form.is_active
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      is_active:
                        event.target
                          .checked,
                    })
                  }
                />

                Compte actif
              </label>
            )}

            <div className="form-actions">
              <button
                className="primary-button"
              >
                {editingId
                  ? "Enregistrer"
                  : "Créer l'utilisateur"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </article>


        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                COMPTES
              </p>

              <h3>
                Utilisateurs de
                l'organisation
              </h3>
            </div>
          </div>

          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="user-list">
              {users.map((item) => (
                <div
                  className="user-row"
                  key={item.id}
                >
                  <div className="user-avatar">
                    {(
                      item.first_name?.[0] ||
                      item.email[0]
                    ).toUpperCase()}
                  </div>

                  <div className="user-main">
                    <strong>
                      {item.full_name}
                    </strong>

                    <span>
                      {item.email}
                    </span>
                  </div>

                  <div>
                    <span className="role-badge">
                      {
                        roleLabels[
                          item.role
                        ]
                      }
                    </span>
                  </div>

                  <div>
                    <span
                      className={
                        item.is_active
                          ? "active-label"
                          : "inactive-label"
                      }
                    >
                      {item.is_active
                        ? "Actif"
                        : "Inactif"}
                    </span>
                  </div>

                  <div className="entity-actions">
                    <button
                      className="text-button"
                      onClick={() => {
                        setEditingId(
                          item.id
                        );

                        setForm({
                          email:
                            item.email,
                          first_name:
                            item.first_name,
                          last_name:
                            item.last_name,
                          phone:
                            item.phone,
                          role:
                            item.role,
                          password: "",
                          is_active:
                            item.is_active,
                        });
                      }}
                    >
                      Modifier
                    </button>

                    {item.is_active && (
                      <button
                        className="danger-text-button"
                        onClick={async () => {
                          if (
                            !confirm(
                              "Désactiver cet utilisateur ?"
                            )
                          ) {
                            return;
                          }

                          await deactivateUser(
                            item.id
                          );

                          await reload();
                        }}
                      >
                        Désactiver
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

      </section>
    </div>
  );
}