import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Map,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type MapMouseEvent,
} from "maplibre-gl";

import workerUrl from
  "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  reverseGeocode,
  searchPlaces,
} from "../api/geocoding";

import type {
  GeocodingResult,
} from "../types/geocoding";

import "./MapLocationPicker.css";


setWorkerUrl(workerUrl);


export type MapLocationValue = {
  address: string;
  latitude: string;
  longitude: string;
};


type MapLocationPickerProps = {
  value: MapLocationValue;

  onChange: (
    value: MapLocationValue
  ) => void;
};


/*
 * Centre initial :
 * Abidjan.
 *
 * MapLibre attend toujours :
 * [longitude, latitude]
 */
const ABIDJAN_CENTER:
  [number, number] = [
    -4.008256,
    5.359952,
  ];


export default function MapLocationPicker({
  value,
  onChange,
}: MapLocationPickerProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<Map | null>(null);

  const markerRef =
    useRef<Marker | null>(null);

  const onChangeRef =
    useRef(onChange);


  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    results,
    setResults,
  ] = useState<
    GeocodingResult[]
  >([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    locating,
    setLocating,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  const [
    showResults,
    setShowResults,
  ] = useState(false);


  useEffect(() => {
    onChangeRef.current =
      onChange;
  }, [onChange]);


  /*
   * Initialisation MapLibre
   */
  useEffect(() => {
    if (
      !mapContainerRef.current
      || mapRef.current
    ) {
      return;
    }


    const latitude =
      Number(value.latitude);

    const longitude =
      Number(value.longitude);


    const hasInitialPosition =
      value.latitude !== ""
      && value.longitude !== ""
      && Number.isFinite(latitude)
      && Number.isFinite(longitude);


    const center:
      [number, number] =
      hasInitialPosition
        ? [
            longitude,
            latitude,
          ]
        : ABIDJAN_CENTER;


    const map = new Map({
      container:
        mapContainerRef.current,

      /*
       * Fond de carte gratuit,
       * sans clé API.
       */
      style:
        "https://tiles.openfreemap.org/styles/liberty",

      center,

      zoom:
        hasInitialPosition
          ? 16
          : 11.5,

      attributionControl:
        true,
    });


    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
      }),

      "top-right"
    );


    mapRef.current = map;


    if (hasInitialPosition) {
      const marker =
        createMarker(
          longitude,
          latitude,
        );

      marker.addTo(map);

      markerRef.current =
        marker;
    }


    const handleClick = async (
      event: MapMouseEvent
    ) => {
      await selectCoordinates(
        event.lngLat.lng,
        event.lngLat.lat,
      );
    };


    map.on(
      "click",
      handleClick
    );


    return () => {
      map.off(
        "click",
        handleClick
      );

      markerRef.current?.remove();

      markerRef.current =
        null;

      map.remove();

      mapRef.current =
        null;
    };
  }, []);


  /*
   * Recherche avec debounce.
   *
   * On évite une requête Photon
   * à chaque caractère.
   */
  useEffect(() => {
    const query =
      searchQuery.trim();


    if (query.length < 3) {
      setResults([]);
      setSearching(false);
      setSearchError("");

      return;
    }


    const timeout =
      window.setTimeout(
        async () => {
          setSearching(true);
          setSearchError("");

          try {
            const data =
              await searchPlaces(
                query
              );

            setResults(data);

            setShowResults(true);
          } catch {
            setResults([]);

            setSearchError(
              "Impossible d'effectuer la recherche pour le moment."
            );
          } finally {
            setSearching(false);
          }
        },

        500
      );


    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [searchQuery]);


  function createMarker(
    longitude: number,
    latitude: number
  ) {
    const marker =
      new Marker({
        color: "#245c4a",
        draggable: true,
      })
        .setLngLat([
          longitude,
          latitude,
        ]);


    marker.on(
      "dragend",
      async () => {
        const position =
          marker.getLngLat();

        await selectCoordinates(
          position.lng,
          position.lat,
          false
        );
      }
    );


    return marker;
  }


  function moveMarker(
    longitude: number,
    latitude: number
  ) {
    const map =
      mapRef.current;


    if (!map) {
      return;
    }


    if (!markerRef.current) {
      markerRef.current =
        createMarker(
          longitude,
          latitude,
        )
          .addTo(map);

      return;
    }


    markerRef.current.setLngLat([
      longitude,
      latitude,
    ]);
  }


  async function selectCoordinates(
    longitude: number,
    latitude: number,
    moveMap = true
  ) {
    const map =
      mapRef.current;


    if (!map) {
      return;
    }


    moveMarker(
      longitude,
      latitude,
    );


    if (moveMap) {
      map.flyTo({
        center: [
          longitude,
          latitude,
        ],

        zoom:
          Math.max(
            map.getZoom(),
            16
          ),

        essential: true,
      });
    }


    setLocating(true);


    try {
      const location =
        await reverseGeocode(
          latitude,
          longitude
        );


      onChangeRef.current({
        address:
          location.address,

        latitude:
          latitude.toFixed(7),

        longitude:
          longitude.toFixed(7),
      });


      if (
        location.address
      ) {
        setSearchQuery(
          location.address
        );
      }
    } catch {
      /*
       * Même si Photon est
       * indisponible, on garde
       * quand même les coordonnées.
       */
      onChangeRef.current({
        address:
          value.address,

        latitude:
          latitude.toFixed(7),

        longitude:
          longitude.toFixed(7),
      });
    } finally {
      setLocating(false);
    }
  }


  function selectSearchResult(
    result: GeocodingResult
  ) {
    const map =
      mapRef.current;


    if (!map) {
      return;
    }


    const longitude =
      Number(
        result.longitude
      );

    const latitude =
      Number(
        result.latitude
      );


    moveMarker(
      longitude,
      latitude,
    );


    map.flyTo({
      center: [
        longitude,
        latitude,
      ],

      zoom: 17,

      essential: true,
    });


    const finalAddress =
      result.address
      || result.name;


    onChangeRef.current({
      address:
        finalAddress,

      latitude:
        latitude.toFixed(7),

      longitude:
        longitude.toFixed(7),
    });


    setSearchQuery(
      finalAddress
    );

    setResults([]);

    setShowResults(false);
  }


  function handleSearchChange(
    event:
      ChangeEvent<HTMLInputElement>
  ) {
    setSearchQuery(
      event.target.value
    );

    setShowResults(true);
  }


  function clearLocation() {
    markerRef.current?.remove();

    markerRef.current =
      null;


    setSearchQuery("");

    setResults([]);

    setShowResults(false);

    setSearchError("");


    onChangeRef.current({
      address: "",
      latitude: "",
      longitude: "",
    });


    mapRef.current?.flyTo({
      center:
        ABIDJAN_CENTER,

      zoom: 11.5,
    });
  }


  return (
    <div
      className="map-location-picker"
    >
      <div
        className="map-picker-title"
      >
        <div>
          <strong>
            Emplacement du site
          </strong>

          <span>
            Recherchez un lieu ou
            cliquez directement
            sur la carte.
          </span>
        </div>
      </div>


      <div
        className="map-search-wrapper"
      >
        <div
          className="map-search-input-wrapper"
        >
          <span
            className="map-search-icon"
          >
            ⌕
          </span>

          <input
            type="search"
            value={
              searchQuery
            }
            onChange={
              handleSearchChange
            }
            onFocus={() => {
              if (
                results.length
              ) {
                setShowResults(
                  true
                );
              }
            }}
            placeholder="Rechercher Angré, CHU d'Angré, Cocody..."
            autoComplete="off"
          />


          {searching && (
            <span
              className="map-search-loader"
            />
          )}
        </div>


        {showResults
          && searchQuery.trim()
            .length >= 3
          && (
            <div
              className="map-search-results"
            >
              {searching && (
                <div
                  className="map-search-message"
                >
                  Recherche...
                </div>
              )}


              {!searching
                && searchError
                && (
                  <div
                    className="map-search-message error"
                  >
                    {
                      searchError
                    }
                  </div>
                )}


              {!searching
                && !searchError
                && results.length === 0
                && (
                  <div
                    className="map-search-message"
                  >
                    Aucun lieu
                    trouvé.
                  </div>
                )}


              {!searching
                && results.map(
                  (
                    result,
                    index
                  ) => (
                    <button
                      type="button"
                      className="map-search-result"
                      key={
                        `${result.longitude}-${result.latitude}-${index}`
                      }
                      onClick={() =>
                        selectSearchResult(
                          result
                        )
                      }
                    >
                      <span
                        className="map-result-icon"
                      >
                        📍
                      </span>

                      <span
                        className="map-result-content"
                      >
                        <strong>
                          {
                            result.name
                          }
                        </strong>

                        <small>
                          {
                            result.address
                          }
                        </small>
                      </span>
                    </button>
                  )
                )}
            </div>
          )}
      </div>


      <div
        className="map-container-wrapper"
      >
        <div
          ref={
            mapContainerRef
          }
          className="map-picker-map"
        />


        <div
          className="map-click-hint"
        >
          Cliquez sur la carte
          pour sélectionner
          l'emplacement
        </div>
      </div>


      {locating && (
        <div
          className="map-status"
        >
          Recherche de
          l'adresse...
        </div>
      )}


      {value.latitude
        && value.longitude
        && (
          <div
            className="map-selected-location"
          >
            <div
              className="map-selected-icon"
            >
              📍
            </div>

            <div
              className="map-selected-content"
            >
              <strong>
                Emplacement
                sélectionné
              </strong>

              <span>
                {value.address
                  || (
                    `${value.latitude}, ${value.longitude}`
                  )}
              </span>
            </div>

            <button
              type="button"
              className="map-clear-button"
              onClick={
                clearLocation
              }
            >
              Effacer
            </button>
          </div>
        )}


      <div
        className="map-picker-help"
      >
        <span>💡</span>

        <span>
          Le marqueur peut être
          déplacé pour ajuster
          précisément
          l'emplacement.
        </span>
      </div>
    </div>
  );
}