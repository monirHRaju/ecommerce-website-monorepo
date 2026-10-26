import axios from "axios";
import Cookies from "js-cookie";

const rawBase =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5001/api/v1";
const cleanBase = rawBase.trim().replace(/\/+$/, "");
const apiBase = cleanBase.endsWith("/api/v1") ? cleanBase : `${cleanBase}/api/v1`;

const api = axios.create({
  baseURL: apiBase,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach JWT from cookie on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear token and redirect to sign-in
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("admin_token");
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
