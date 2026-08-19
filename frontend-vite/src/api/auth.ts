import api from "./client";
import type { CurrentUser, LoginResponse } from "../types/auth";

export async function login(email: string, password: string) {
  const { data } = await api.post<LoginResponse>("/auth/login/", {
    email,
    password,
  });

  localStorage.setItem("fixtrack_access_token", data.access);
  localStorage.setItem("fixtrack_refresh_token", data.refresh);

  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get<CurrentUser>("/auth/me/");
  return data;
}

export function logout() {
  localStorage.removeItem("fixtrack_access_token");
  localStorage.removeItem("fixtrack_refresh_token");
}
