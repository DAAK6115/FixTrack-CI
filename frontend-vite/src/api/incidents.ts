import api from "./client";

import type {
  CreateIncidentInput,
  IncidentCategory,
  IncidentDetail,
  IncidentFilters,
  IncidentListItem,
  IncidentPriority,
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


export async function validateIncident(
  id: number,
  payload: {
    validated_priority?:
      IncidentPriority;
    comment?: string;
  }
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/validate/`,
      payload
    );

  return data;
}


export async function rejectIncident(
  id: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/reject/`,
      {
        comment,
      }
    );

  return data;
}


export async function assignIncident(
  id: number,
  technicianId: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/assign/`,
      {
        technician_id:
          technicianId,
        comment,
      }
    );

  return data;
}


export async function startIncident(
  id: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/start/`,
      {
        comment,
      }
    );

  return data;
}


export async function holdIncident(
  id: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/hold/`,
      {
        comment,
      }
    );

  return data;
}


export async function resumeIncident(
  id: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/resume/`,
      {
        comment,
      }
    );

  return data;
}


export async function resolveIncident(
  id: number,
  payload: {
    resolution: string;
    notes?: string;
  }
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/resolve/`,
      payload
    );

  return data;
}


export async function closeIncident(
  id: number,
  comment = ""
) {
  const { data } =
    await api.post<IncidentDetail>(
      `/incidents/${id}/close/`,
      {
        comment,
      }
    );

  return data;
}
