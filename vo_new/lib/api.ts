// Centralized API config and fetch utility

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8002";

// Placeholder for getting auth token (to be implemented)
function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || undefined;
  }
  return undefined;
}

function getSelectOrg() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("selectedOrg") || undefined;
  }
  return undefined;
}

function getHeaders() {
  const token = getAuthToken();
  const selectedOrgSlug = getSelectOrg();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(selectedOrgSlug ? { "x-dalgo-org": selectedOrgSlug } : {}),
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
    ...getHeaders(),
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper for GET requests
export function apiGet(path: string, options: RequestInit = {}) {
  return apiFetch(path, { ...options, method: 'GET' });
}

// Helper for POST requests
export function apiPost(path: string, body: any, options: RequestInit = {}) {
  return apiFetch(path, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
} 