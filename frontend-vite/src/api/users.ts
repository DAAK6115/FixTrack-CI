import api from "./client";

import type {
  ManagedUser,
  UserInput,
} from "../types/user";


export async function getUsers() {
  const { data } = await api.get<ManagedUser[]>(
    "/users/"
  );

  return data;
}


export async function createUser(
  payload: UserInput
) {
  const { data } = await api.post<ManagedUser>(
    "/users/",
    payload
  );

  return data;
}


export async function updateUser(
  id: number,
  payload: Partial<UserInput>
) {
  const { data } = await api.patch<ManagedUser>(
    `/users/${id}/`,
    payload
  );

  return data;
}


export async function deactivateUser(
  id: number
) {
  await api.delete(
    `/users/${id}/`
  );
}


export async function getTechnicians() {
  const { data } = await api.get<ManagedUser[]>(
    "/users/technicians/"
  );

  return data;
}