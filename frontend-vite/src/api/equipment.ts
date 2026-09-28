import api from "./client";

import type {
  Equipment,
  EquipmentCategory,
  EquipmentInput,
} from "../types/equipment";

import type {
  IncidentListItem,
} from "../types/incident";


export async function getEquipmentCategories() {
  const { data } = await api.get<
    EquipmentCategory[]
  >(
    "/equipment/categories/"
  );

  return data;
}


export async function getEquipment(
  filters: {
    search?: string;
    status?: string;
    category?: string;
    site?: string;
  } = {}
) {
  const { data } = await api.get<
    Equipment[]
  >(
    "/equipment/items/",
    {
      params: filters,
    }
  );

  return data;
}


export async function getEquipmentItem(
  id: number
) {
  const { data } = await api.get<
    Equipment
  >(
    `/equipment/items/${id}/`
  );

  return data;
}


export async function createEquipment(
  payload: EquipmentInput
) {
  const { data } = await api.post<
    Equipment
  >(
    "/equipment/items/",
    payload
  );

  return data;
}


export async function updateEquipment(
  id: number,
  payload:
    Partial<EquipmentInput>
) {
  const { data } = await api.patch<
    Equipment
  >(
    `/equipment/items/${id}/`,
    payload
  );

  return data;
}


export async function getEquipmentIncidents(
  id: number
) {
  const { data } = await api.get<
    IncidentListItem[]
  >(
    `/equipment/items/${id}/incidents/`
  );

  return data;
}


export function getEquipmentQrUrl(
  id: number
) {
  const apiUrl =
    import.meta.env.VITE_API_URL
    ?? "http://127.0.0.1:8000/api/v1";

  return (
    `${apiUrl}/equipment/items/${id}/qr/`
  );
}


export async function resolveEquipment(
  token: string
) {
  const { data } = await api.get<
    Equipment
  >(
    `/equipment/resolve/${encodeURIComponent(token)}/`
  );

  return data;
}
