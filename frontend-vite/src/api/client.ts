import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("fixtrack_access_token");

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      localStorage.getItem("fixtrack_refresh_token")
    ) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem("fixtrack_refresh_token");

        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh/`,
          { refresh }
        );

        const newAccessToken = response.data.access;
        localStorage.setItem("fixtrack_access_token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem("fixtrack_access_token");
        localStorage.removeItem("fixtrack_refresh_token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
