// Centralized API config and fetch utility

const API_BASE_URL = "http://localhost:8002";

// Placeholder for getting auth token (to be implemented)
function getAuthToken() {
  // e.g., return localStorage.getItem('authToken')
  return "1352d703d1d5d07041e67f98909950cfadbbbf93";
}

function getHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "x-dalgo-org": "test_auto"
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