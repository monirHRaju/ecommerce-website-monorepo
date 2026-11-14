const rawBase =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5001/api/v1";
const cleanBase = rawBase.trim().replace(/\/+$/, "");
export const API_BASE = cleanBase.endsWith("/api/v1")
  ? cleanBase
  : `${cleanBase}/api/v1`;

/**
 * In the browser (including Facebook / Instagram in-app WebViews), prefer the
 * same-origin `/api/v1` proxy so requests never fail due to cross-origin blocks,
 * www vs non-www mismatches, or localhost port restrictions on mobile devices.
 */
export const BROWSER_API_BASE = "/api/v1";

export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isBrowser = typeof window !== "undefined";
  const base = isBrowser ? BROWSER_API_BASE : API_BASE;
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${base}${normalizedEndpoint}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (isBrowser) {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        defaultHeaders["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // ignore storage access errors in restricted webviews
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    if (isBrowser && !endpoint.startsWith("http")) {
      res = await fetch(`${API_BASE}${normalizedEndpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {}),
        },
      });
    } else {
      throw err;
    }
  }

  if (!res.ok) {
    let errorMsg = `API error: ${res.status} ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}
