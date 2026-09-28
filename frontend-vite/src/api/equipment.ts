import api from "./client";

import type {
  ArchivedEquipmentRecord,
  Equipment,
  EquipmentAuditLog,
  EquipmentCategory,
  EquipmentDeletionRequest,
  EquipmentInput,
  EquipmentPrintContext,
  PendingEquipmentDeletion,
} from "../types/equipment";

import type {
  IncidentListItem,
} from "../types/incident";


function buildEquipmentFormData(
  payload:
    Partial<EquipmentInput>,
  justification?: string
) {
  const formData =
    new FormData();


  const append = (
    key: string,
    value:
      | string
      | number
      | null
      | undefined
  ) => {
    if (
      value === undefined
      || value === null
    ) {
      return;
    }

    formData.append(
      key,
      String(value)
    );
  };


  append(
    "code",
    payload.code
  );

  append(
    "name",
    payload.name
  );

  append(
    "category",
    payload.category
  );

  append(
    "location",
    payload.location
  );

  append(
    "brand",
    payload.brand
  );

  append(
    "model_name",
    payload.model_name
  );

  append(
    "serial_number",
    payload.serial_number
  );

  append(
    "installation_date",
    payload.installation_date
  );

  append(
    "status",
    payload.status
  );

  append(
    "description",
    payload.description
  );

  append(
    "notes",
    payload.notes
  );


  if (payload.image) {
    formData.append(
      "image",
      payload.image
    );
  }


  if (justification) {
    formData.append(
      "justification",
      justification
    );
  }


  return formData;
}


export async function getEquipmentCategories() {
  const { data } = await api.get<
    EquipmentCategory[]
  >(
    "/equipment/categories/"
  );

  return data;
}


export async function createEquipmentCategory(
  payload: {
    name: string;
    icon: string;
    description: string;
  }
) {
  const { data } = await api.post<
    EquipmentCategory
  >(
    "/equipment/categories/",
    payload
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


export async function getArchivedEquipment() {
  const { data } = await api.get<
    ArchivedEquipmentRecord[]
  >(
    "/equipment/archives/"
  );

  return data;
}


export async function getEquipmentPrintContext() {
  const { data } = await api.get<
    EquipmentPrintContext
  >(
    "/equipment/print-context/"
  );

  return data;
}


export async function getEquipmentQrBlob(
  id: number
) {
  const { data } = await api.get<
    Blob
  >(
    `/equipment/items/${id}/qr/`,
    {
      responseType: "blob",
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
    buildEquipmentFormData(
      payload
    )
  );

  return data;
}


export async function updateEquipmentWithJustification(
  id: number,
  payload:
    Partial<EquipmentInput>,
  justification: string,
  removeImage = false
) {
  const formData =
    buildEquipmentFormData(
      payload,
      justification
    );

  if (removeImage) {
    formData.append(
      "remove_image",
      "true"
    );
  }

  const { data } = await api.post<
    Equipment
  >(
    (
      `/equipment/items/${id}/`
      + "update-with-justification/"
    ),
    formData
  );

  return data;
}


export async function requestEquipmentDeletion(
  id: number,
  justification: string
) {
  const { data } = await api.post<
    EquipmentDeletionRequest
  >(
    `/equipment/items/${id}/request-deletion/`,
    {
      justification,
    }
  );

  return data;
}


export async function getPendingEquipmentDeletion(
  id: number
) {
  const { data } = await api.get<
    PendingEquipmentDeletion
  >(
    `/equipment/items/${id}/pending-deletion/`
  );

  return data;
}


export async function getEquipmentDeletionRequests() {
  const { data } = await api.get<
    EquipmentDeletionRequest[]
  >(
    "/equipment/deletion-requests/"
  );

  return data;
}


export async function approveEquipmentDeletion(
  id: number,
  reviewNote: string
) {
  const { data } = await api.post<
    EquipmentDeletionRequest
  >(
    `/equipment/deletion-requests/${id}/approve/`,
    {
      review_note:
        reviewNote,
    }
  );

  return data;
}


export async function rejectEquipmentDeletion(
  id: number,
  reviewNote: string
) {
  const { data } = await api.post<
    EquipmentDeletionRequest
  >(
    `/equipment/deletion-requests/${id}/reject/`,
    {
      review_note:
        reviewNote,
    }
  );

  return data;
}


export async function getEquipmentAudit(
  id: number
) {
  const { data } = await api.get<
    EquipmentAuditLog[]
  >(
    `/equipment/items/${id}/audit/`
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
