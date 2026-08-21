import api from "./client";

import type {
  CreateIncidentInput,
  IncidentCategory,
  IncidentDetail,
  IncidentFilters,
  IncidentListItem,
} from "../types/incident";


export async function getIncidentCategories() {
  const { data } = await api.get<
    IncidentCategory[]
  >(
    "/incidents/categories/"
  );

  return data;
}


export async function getIncidents(
  filters: IncidentFilters = {}
) {
  const { data } = await api.get<
    IncidentListItem[]
  >(
    "/incidents/",
    {
      params: filters,
    }
  );

  return data;
}


export async function getIncident(
  id: number
) {
  const { data } = await api.get<
    IncidentDetail
  >(
    `/incidents/${id}/`
  );

  return data;
}


export async function createIncident(
  payload: CreateIncidentInput
) {
  const formData =
    new FormData();


  formData.append(
    "category",
    String(payload.category)
  );

  formData.append(
    "location",
    String(payload.location)
  );

  formData.append(
    "title",
    payload.title
  );

  formData.append(
    "description",
    payload.description
  );

  formData.append(
    "requested_priority",
    payload.requested_priority
  );


  if (payload.latitude) {
    formData.append(
      "latitude",
      payload.latitude
    );
  }


  if (payload.longitude) {
    formData.append(
      "longitude",
      payload.longitude
    );
  }


  payload.images.forEach(
    (image) => {
      formData.append(
        "images",
        image
      );
    }
  );


  const { data } = await api.post<{
    id: number;
    reference: string;
  }>(
    "/incidents/",
    formData
  );

  return data;
}