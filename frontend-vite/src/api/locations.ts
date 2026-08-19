import api from "./client";

import type {
  Building,
  BuildingInput,
  Floor,
  FloorInput,
  Location,
  LocationInput,
  Site,
  SiteInput,
} from "../types/location";


export async function getSites() {
  const { data } = await api.get<Site[]>(
    "/locations/sites/"
  );

  return data;
}


export async function createSite(
  payload: SiteInput
) {
  const { data } = await api.post<Site>(
    "/locations/sites/",
    payload
  );

  return data;
}


export async function updateSite(
  id: number,
  payload: Partial<SiteInput>
) {
  const { data } = await api.patch<Site>(
    `/locations/sites/${id}/`,
    payload
  );

  return data;
}


export async function deleteSite(
  id: number
) {
  await api.delete(
    `/locations/sites/${id}/`
  );
}


export async function getBuildings() {
  const { data } = await api.get<Building[]>(
    "/locations/buildings/"
  );

  return data;
}


export async function createBuilding(
  payload: BuildingInput
) {
  const { data } = await api.post<Building>(
    "/locations/buildings/",
    payload
  );

  return data;
}


export async function updateBuilding(
  id: number,
  payload: Partial<BuildingInput>
) {
  const { data } = await api.patch<Building>(
    `/locations/buildings/${id}/`,
    payload
  );

  return data;
}


export async function deleteBuilding(
  id: number
) {
  await api.delete(
    `/locations/buildings/${id}/`
  );
}


export async function getFloors() {
  const { data } = await api.get<Floor[]>(
    "/locations/floors/"
  );

  return data;
}


export async function createFloor(
  payload: FloorInput
) {
  const { data } = await api.post<Floor>(
    "/locations/floors/",
    payload
  );

  return data;
}


export async function updateFloor(
  id: number,
  payload: Partial<FloorInput>
) {
  const { data } = await api.patch<Floor>(
    `/locations/floors/${id}/`,
    payload
  );

  return data;
}


export async function deleteFloor(
  id: number
) {
  await api.delete(
    `/locations/floors/${id}/`
  );
}


export async function getLocations() {
  const { data } = await api.get<Location[]>(
    "/locations/rooms/"
  );

  return data;
}


export async function createLocation(
  payload: LocationInput
) {
  const { data } = await api.post<Location>(
    "/locations/rooms/",
    payload
  );

  return data;
}


export async function updateLocation(
  id: number,
  payload: Partial<LocationInput>
) {
  const { data } = await api.patch<Location>(
    `/locations/rooms/${id}/`,
    payload
  );

  return data;
}


export async function deleteLocation(
  id: number
) {
  await api.delete(
    `/locations/rooms/${id}/`
  );
}