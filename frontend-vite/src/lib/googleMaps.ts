import {
  importLibrary,
  setOptions,
} from "@googlemaps/js-api-loader";


let configured = false;


function configureGoogleMaps() {
  if (configured) {
    return;
  }

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_GOOGLE_MAPS_API_KEY n'est pas configurée."
    );
  }

  setOptions({
    key: apiKey,
    v: "weekly",
  });

  configured = true;
}


export async function loadGoogleMaps() {
  configureGoogleMaps();

  const [
    mapsLibrary,
    markerLibrary,
    placesLibrary,
    geocodingLibrary,
  ] = await Promise.all([
    importLibrary(
      "maps"
    ) as Promise<google.maps.MapsLibrary>,

    importLibrary(
      "marker"
    ) as Promise<google.maps.MarkerLibrary>,

    importLibrary(
      "places"
    ) as Promise<google.maps.PlacesLibrary>,

    importLibrary(
      "geocoding"
    ) as Promise<google.maps.GeocodingLibrary>,
  ]);

  return {
    Map: mapsLibrary.Map,

    AdvancedMarkerElement:
      markerLibrary.AdvancedMarkerElement,

    PlaceAutocompleteElement:
      placesLibrary.PlaceAutocompleteElement,

    Geocoder:
      geocodingLibrary.Geocoder,
  };
}