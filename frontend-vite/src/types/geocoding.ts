export type GeocodingResult = {
  name: string;
  address: string;

  latitude: number;
  longitude: number;

  city: string;
  country: string;
  type: string;
};


export type ReverseGeocodingResult = {
  address: string;

  latitude: number;
  longitude: number;
};