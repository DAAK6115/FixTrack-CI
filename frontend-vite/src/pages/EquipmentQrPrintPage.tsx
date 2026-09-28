import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getEquipment,
  getEquipmentPrintContext,
  getEquipmentQrBlob,
} from "../api/equipment";

import BrandLogo from "../components/BrandLogo";

import type {
  Equipment,
  EquipmentPrintContext,
} from "../types/equipment";


type LogoMode =
  | "FIXTRACK"
  | "ORGANIZATION"
  | "BOTH";


export default function EquipmentQrPrintPage() {
  const [
    equipment,
    setEquipment,
  ] = useState<
    Equipment[]
  >([]);

  const [
    context,
    setContext,
  ] = useState<
    EquipmentPrintContext | null
  >(null);

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    Set<number>
  >(
    new Set()
  );

  const [
    qrUrls,
    setQrUrls,
  ] = useState<
    Record<number, string>
  >({});

  const [
    logoMode,
    setLogoMode,
  ] = useState<LogoMode>(
    "FIXTRACK"
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    qrLoading,
    setQrLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    Promise.all([
      getEquipment(),
      getEquipmentPrintContext(),
    ])
      .then(
        ([
          equipmentData,
          contextData,
        ]) => {
          setEquipment(
            equipmentData
          );

          setContext(
            contextData
          );

          setSelectedIds(
            new Set(
              equipmentData.map(
                (item) =>
                  item.id
              )
            )
          );
        }
      )
      .catch(() => {
        setError(
          "Impossible de préparer l'impression des QR Codes."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);


  useEffect(() => {
    let cancelled = false;

    const missing =
      equipment.filter(
        (item) =>
          selectedIds.has(
            item.id
          )
          && !qrUrls[
            item.id
          ]
      );

    if (!missing.length) {
      return;
    }

    const loadQr = async () => {
      setQrLoading(true);

      const created:
        Record<number, string> = {};

      try {
        for (
          const item
          of missing
        ) {
          const blob =
            await getEquipmentQrBlob(
              item.id
            );

          if (cancelled) {
            return;
          }

          created[
            item.id
          ] = (
            URL.createObjectURL(
              blob
            )
          );
        }

        if (!cancelled) {
          setQrUrls(
            (current) => ({
              ...current,
              ...created,
            })
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            "Impossible de charger certains QR Codes."
          );
        }
      } finally {
        if (!cancelled) {
          setQrLoading(false);
        }
      }
    };

    void loadQr();

    return () => {
      cancelled = true;
    };
  }, [
    equipment,
    selectedIds,
    qrUrls,
  ]);


  useEffect(() => {
    return () => {
      Object.values(
        qrUrls
      ).forEach(
        (url) => {
          URL.revokeObjectURL(
            url
          );
        }
      );
    };
  }, []);


  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLocaleLowerCase(
              "fr"
            );

        if (!query) {
          return equipment;
        }

        return equipment.filter(
          (item) =>
            [
              item.code,
              item.name,
              item.category_name,
              item.site_name,
              item.location_name,
            ]
              .join(" ")
              .toLocaleLowerCase(
                "fr"
              )
              .includes(
                query
              )
        );
      },
      [
        equipment,
        search,
      ]
    );


  const selected =
    useMemo(
      () => (
        equipment.filter(
          (item) =>
            selectedIds.has(
              item.id
            )
        )
      ),
      [
        equipment,
        selectedIds,
      ]
    );


  const toggleEquipment = (
    id: number
  ) => {
    setSelectedIds(
      (current) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(id)
        ) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  };


  const selectAllVisible = () => {
    setSelectedIds(
      (current) => {
        const next =
          new Set(
            current
          );

        filtered.forEach(
          (item) =>
            next.add(
              item.id
            )
        );

        return next;
      }
    );
  };


  const clearSelection = () => {
    setSelectedIds(
      new Set()
    );
  };


  const print = () => {
    if (
      !selected.length
    ) {
      setError(
        "Sélectionnez au moins un équipement."
      );

      return;
    }

    if (
      selected.some(
        (item) =>
          !qrUrls[
            item.id
          ]
      )
    ) {
      setError(
        "Attendez la fin du chargement des QR Codes."
      );

      return;
    }

    setError("");

    window.print();
  };


  const showFixTrack =
    logoMode === "FIXTRACK"
    || logoMode === "BOTH";

  const showOrganization =
    logoMode === "ORGANIZATION"
    || logoMode === "BOTH";


  return (
    <div className="page-stack qr-print-page">

      <section className="hero-card equipment-hero qr-print-controls">
        <div>
          <p className="eyebrow">
            IDENTIFICATION DU PARC
          </p>

          <h2>
            Imprimer les QR Codes
          </h2>

          <p className="muted">
            Sélectionnez les équipements,
            choisissez le logo à afficher,
            puis imprimez les étiquettes.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={
            qrLoading
            || !selected.length
          }
          onClick={
            print
          }
        >
          {
            qrLoading
              ? "Préparation..."
              : (
                  `Imprimer (${selected.length})`
                )
          }
        </button>
      </section>


      {error && (
        <div className="error-box qr-print-controls">
          {error}
        </div>
      )}


      <section className="panel qr-print-controls qr-print-options">
        <div>
          <p className="eyebrow">
            LOGO SUR L'ÉTIQUETTE
          </p>

          <div className="qr-logo-options">
            <label>
              <input
                type="radio"
                name="logo-mode"
                checked={
                  logoMode
                  === "FIXTRACK"
                }
                onChange={() =>
                  setLogoMode(
                    "FIXTRACK"
                  )
                }
              />

              <span>
                FixTrack CI
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="logo-mode"
                checked={
                  logoMode
                  === "ORGANIZATION"
                }
                onChange={() =>
                  setLogoMode(
                    "ORGANIZATION"
                  )
                }
              />

              <span>
                Logo entreprise
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="logo-mode"
                checked={
                  logoMode
                  === "BOTH"
                }
                onChange={() =>
                  setLogoMode(
                    "BOTH"
                  )
                }
              />

              <span>
                Les deux
              </span>
            </label>
          </div>

          {(
            showOrganization
            && !context
              ?.organization_logo
          ) && (
            <small className="qr-company-logo-warning">
              Aucun logo n'est configuré
              pour l'organisation. Son nom
              sera affiché à la place.
            </small>
          )}
        </div>


        <div>
          <p className="eyebrow">
            ÉQUIPEMENTS
          </p>

          <div className="qr-selection-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={
                selectAllVisible
              }
            >
              Tout sélectionner
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={
                clearSelection
              }
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      </section>


      <section className="panel qr-print-controls">
        <input
          className="qr-print-search"
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(
              event.target.value
            )
          }
          placeholder="Rechercher un équipement..."
        />


        {loading ? (
          <div className="analytics-empty">
            Chargement...
          </div>
        ) : (
          <div className="qr-equipment-selector">
            {filtered.map(
              (item) => (
                <label
                  className="qr-equipment-choice"
                  key={
                    item.id
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.has(
                        item.id
                      )
                    }
                    onChange={() =>
                      toggleEquipment(
                        item.id
                      )
                    }
                  />

                  <div className="qr-equipment-choice-photo">
                    {item.image_url ? (
                      <img
                        src={
                          item.image_url
                        }
                        alt=""
                      />
                    ) : (
                      <span>
                        {
                          item.category_icon
                          || "🧰"
                        }
                      </span>
                    )}
                  </div>

                  <div>
                    <strong>
                      {
                        item.code
                      }
                    </strong>

                    <span>
                      {
                        item.name
                      }
                    </span>

                    <small>
                      {
                        item.site_name
                      }
                      {" • "}
                      {
                        item.location_name
                      }
                    </small>
                  </div>
                </label>
              )
            )}
          </div>
        )}
      </section>


      <section className="qr-print-sheet">

        {selected.map(
          (item) => (
            <article
              className="qr-print-label"
              key={
                item.id
              }
            >
              <div className="qr-print-brand-row">

                {showOrganization && (
                  <div className="qr-print-company-brand">
                    {context
                      ?.organization_logo ? (
                      <img
                        src={
                          context
                            .organization_logo
                        }
                        alt={
                          context
                            .organization_name
                        }
                      />
                    ) : (
                      <strong>
                        {
                          context
                            ?.organization_name
                          || "Organisation"
                        }
                      </strong>
                    )}
                  </div>
                )}


                {showFixTrack && (
                  <div className="qr-print-fixtrack-brand">
                    <BrandLogo
                      className="fixtrack-brand-logo-print"
                    />
                  </div>
                )}

              </div>


              <div className="qr-print-code">
                {qrUrls[
                  item.id
                ] ? (
                  <img
                    src={
                      qrUrls[
                        item.id
                      ]
                    }
                    alt={
                      `QR ${item.code}`
                    }
                  />
                ) : (
                  <div className="qr-print-code-loading">
                    QR...
                  </div>
                )}
              </div>


              <div className="qr-print-equipment-info">
                <span>
                  {
                    item.category_name
                  }
                </span>

                <strong>
                  {
                    item.name
                  }
                </strong>

                <b>
                  {
                    item.code
                  }
                </b>

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
              </div>


              <p className="qr-print-instruction">
                Scannez pour identifier
                l'équipement ou signaler
                une panne.
              </p>
            </article>
          )
        )}


        {!selected.length && (
          <div className="panel analytics-empty qr-print-controls">
            Sélectionnez les équipements
            à imprimer.
          </div>
        )}

      </section>

    </div>
  );
}
