import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  loadGoogleMaps,
} from "../lib/googleMaps";


export type MapLocationValue = {
  address: string;
  latitude: string;
  longitude: string;
};


type GoogleMapPickerProps = {
  value: MapLocationValue;

  onChange: (
    value: MapLocationValue
  ) => void;
};


const ABIDJAN_CENTER = {
  lat: 5.359952,
  lng: -4.008256,
};


export default function GoogleMapPicker({
  value,
  onChange,
}: GoogleMapPickerProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const autocompleteContainerRef =
    useRef<HTMLDivElement | null>(null);

  const markerRef =
    useRef<
      google.maps.marker.AdvancedMarkerElement | null
    >(null);

  const onChangeRef = useRef(onChange);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);


  useEffect(() => {
    let disposed = false;

    let mapClickListener:
      google.maps.MapsEventListener | null =
      null;

    let markerDragListener:
      google.maps.MapsEventListener | null =
      null;

    let autocompleteElement:
      google.maps.places.PlaceAutocompleteElement
      | null = null;

    let autocompleteHandler:
      EventListener | null = null;


    async function initializeMap() {
      if (
        !mapContainerRef.current ||
        !autocompleteContainerRef.current
      ) {
        return;
      }


      try {
        setLoading(true);
        setError("");


        const {
          Map,
          AdvancedMarkerElement,
          PlaceAutocompleteElement,
          Geocoder,
        } = await loadGoogleMaps();


        if (disposed) {
          return;
        }


        const initialLatitude =
          Number(value.latitude);

        const initialLongitude =
          Number(value.longitude);


        const hasInitialPosition =
          Number.isFinite(initialLatitude) &&
          Number.isFinite(initialLongitude) &&
          value.latitude !== "" &&
          value.longitude !== "";


        const initialPosition =
          hasInitialPosition
            ? {
                lat: initialLatitude,
                lng: initialLongitude,
              }
            : ABIDJAN_CENTER;


        const map = new Map(
          mapContainerRef.current,
          {
            center: initialPosition,

            zoom:
              hasInitialPosition
                ? 17
                : 12,

            mapId:
              import.meta.env
                .VITE_GOOGLE_MAPS_MAP_ID ||
              "DEMO_MAP_ID",

            mapTypeControl: false,

            streetViewControl: false,

            fullscreenControl: true,

            gestureHandling: "greedy",
          }
        );


        const marker =
          new AdvancedMarkerElement({
            map,

            position:
              hasInitialPosition
                ? initialPosition
                : undefined,

            title:
              "Emplacement du site",

            gmpDraggable: true,
          });


        markerRef.current = marker;


        const geocoder =
          new Geocoder();


        async function reverseGeocode(
          position:
            google.maps.LatLngLiteral
        ) {
          try {
            const response =
              await geocoder.geocode({
                location: position,
              });


            return (
              response.results[0]
                ?.formatted_address ||
              ""
            );
          } catch (error) {
            console.error(
              "Reverse geocoding error:",
              error
            );

            return "";
          }
        }


        async function selectPosition(
          position:
            google.maps.LatLngLiteral,

          knownAddress?: string
        ) {
          marker.position = position;

          map.panTo(position);

          map.setZoom(17);


          const address =
            knownAddress ||
            (
              await reverseGeocode(
                position
              )
            );


          onChangeRef.current({
            address,

            latitude:
              position.lat.toFixed(7),

            longitude:
              position.lng.toFixed(7),
          });
        }


        /*
         * Recherche Google Places
         */
        autocompleteElement =
          new PlaceAutocompleteElement();


        autocompleteElement.placeholder =
          "Rechercher un lieu, une adresse, un établissement...";


        /*
         * FixTrack CI :
         * résultats limités à la Côte d'Ivoire.
         *
         * Supprime cette ligne plus tard
         * si FixTrack devient international.
         */
        autocompleteElement
          .includedRegionCodes = [
          "ci",
        ];


        autocompleteContainerRef.current
          .replaceChildren(
            autocompleteElement
          );


        autocompleteHandler =
          (async (
            event: Event
          ) => {
            const placeEvent =
              event as google.maps.places.PlacePredictionSelectEvent;


            const place =
              placeEvent
                .placePrediction
                .toPlace();


            await place.fetchFields({
              fields: [
                "displayName",
                "formattedAddress",
                "location",
                "viewport",
              ],
            });


            if (!place.location) {
              return;
            }


            const position = {
              lat:
                place.location.lat(),

              lng:
                place.location.lng(),
            };


            if (place.viewport) {
              map.fitBounds(
                place.viewport
              );
            }


            await selectPosition(
              position,

              place.formattedAddress ||
                place.displayName ||
                ""
            );
          }) as EventListener;


        autocompleteElement
          .addEventListener(
            "gmp-select",
            autocompleteHandler
          );


        /*
         * Sélection directement
         * en cliquant sur la carte
         */
        mapClickListener =
          map.addListener(
            "click",
            async (
              event:
                google.maps.MapMouseEvent
            ) => {
              if (!event.latLng) {
                return;
              }


              await selectPosition(
                event.latLng.toJSON()
              );
            }
          );


        /*
         * Le marqueur peut également
         * être déplacé pour ajuster
         * précisément l'emplacement.
         */
        markerDragListener =
          marker.addListener(
            "dragend",
            async (
              event:
                google.maps.MapMouseEvent
            ) => {
              if (!event.latLng) {
                return;
              }


              await selectPosition(
                event.latLng.toJSON()
              );
            }
          );


        setLoading(false);
      } catch (error) {
        console.error(error);

        setError(
          "Impossible de charger Google Maps. Vérifie la clé API et les APIs Google activées."
        );

        setLoading(false);
      }
    }


    void initializeMap();


    return () => {
      disposed = true;


      if (mapClickListener) {
        google.maps.event.removeListener(
          mapClickListener
        );
      }


      if (markerDragListener) {
        google.maps.event.removeListener(
          markerDragListener
        );
      }


      if (
        autocompleteElement &&
        autocompleteHandler
      ) {
        autocompleteElement
          .removeEventListener(
            "gmp-select",
            autocompleteHandler
          );
      }


      if (markerRef.current) {
        markerRef.current.map =
          null;

        markerRef.current =
          null;
      }
    };
  }, []);


  const clearLocation = () => {
    if (markerRef.current) {
      markerRef.current.position =
        null;
    }


    onChange({
      address: "",
      latitude: "",
      longitude: "",
    });
  };


  return (
    <div className="google-map-picker">

      <div className="map-picker-header">
        <div>
          <strong>
            Emplacement du site
          </strong>

          <span>
            Recherchez un lieu ou
            cliquez directement sur
            la carte.
          </span>
        </div>
      </div>


      <div
        ref={
          autocompleteContainerRef
        }
        className="google-place-search"
      />


      {loading && (
        <div className="map-loading">
          Chargement de Google Maps...
        </div>
      )}


      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      <div
        ref={mapContainerRef}
        className="google-map-container"
      />


      {value.latitude &&
        value.longitude && (
          <div className="selected-map-location">

            <div className="selected-location-icon">
              📍
            </div>

            <div>
              <strong>
                Position sélectionnée
              </strong>

              <span>
                {value.address ||
                  "Emplacement sélectionné sur la carte"}
              </span>
            </div>

            <button
              type="button"
              className="danger-text-button"
              onClick={
                clearLocation
              }
            >
              Effacer
            </button>

          </div>
        )}


      <p className="map-help">
        Vous pouvez déplacer le
        marqueur pour ajuster
        précisément l'emplacement.
      </p>

    </div>
  );
}