import api from "./client";

import type {
  Organization,
  OrganizationUpdateInput,
} from "../types/organization";


export async function getCurrentOrganization() {
  const { data } = await api.get<
    Organization
  >(
    "/organizations/current/"
  );

  return data;
}


export async function updateCurrentOrganization(
  payload:
    OrganizationUpdateInput,
  logo:
    File | null,
  removeLogo = false
) {
  const formData =
    new FormData();

  formData.append(
    "name",
    payload.name
  );

  formData.append(
    "type",
    payload.type
  );

  formData.append(
    "email",
    payload.email
  );

  formData.append(
    "phone",
    payload.phone
  );

  formData.append(
    "address",
    payload.address
  );


  if (logo) {
    formData.append(
      "logo",
      logo
    );
  }


  if (removeLogo) {
    formData.append(
      "remove_logo",
      "true"
    );
  }


  const { data } = await api.patch<
    Organization
  >(
    "/organizations/current/",
    formData
  );

  return data;
}
