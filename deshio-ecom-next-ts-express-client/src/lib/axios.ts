import axios from "axios";
import { API_BASE, BROWSER_API_BASE } from "./api";

const api = axios.create({
  baseURL: typeof window !== "undefined" ? BROWSER_API_BASE : API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach JWT access token from localStorage on every request (safe for in-app WebViews)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage SecurityError in restricted Facebook/Instagram in-app WebViews
    }
  }
  return config;
});

// Fallback to direct API_BASE if same-origin rewrite fails, and handle 401 token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    // If same-origin /api/v1 proxy returned a gateway/not-found or network error, retry directly against API_BASE
    const isNetworkOrGatewayError =
      !error.response ||
      error.response.status === 502 ||
      error.response.status === 503 ||
      error.response.status === 504 ||
      (error.response.status === 404 &&
        typeof error.response.data === "string" &&
        error.response.data.includes("<!DOCTYPE html>"));

    if (
      typeof window !== "undefined" &&
      isNetworkOrGatewayError &&
      !original._directFallbackTried &&
      original.baseURL === BROWSER_API_BASE &&
      API_BASE.startsWith("http")
    ) {
      original._directFallbackTried = true;
      original.baseURL = API_BASE;
      return api(original);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        if (!refreshToken) throw new Error("No refresh token");

        const refreshBase =
          typeof window !== "undefined" ? BROWSER_API_BASE : API_BASE;
        const { data } = await axios.post(`${refreshBase}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = data.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(original);
      } catch {
        // Refresh failed — clear stale tokens safely
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
          } catch {
            // ignore storage errors
          }
          // Only redirect to /login if the user is on a protected dashboard route
          if (window.location.pathname.startsWith("/dashboard")) {
            window.location.href = "/login";
          } else if (original.headers?.Authorization) {
            // Retry public request without stale Authorization header
            delete original.headers.Authorization;
            return api(original);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
