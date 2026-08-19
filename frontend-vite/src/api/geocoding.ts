import api from "./client";

import type {
  GeocodingResult,
  ReverseGeocodingResult,
} from "../types/geocoding";


export async function searchPlaces(
  query: string
) {
  const { data } = await api.get<
    GeocodingResult[]
  >(
    "/locations/geocoding/search/",
    {
      params: {
        q: query,
      },
    }
  );

  return data;
}


export async function reverseGeocode(
  latitude: number,
  longitude: number
) {
  const { data } = await api.get<
    ReverseGeocodingResult
  >(
    "/locations/geocoding/reverse/",
    {
      params: {
        lat: latitude,
        lon: longitude,
      },
    }
  );

  return data;
}