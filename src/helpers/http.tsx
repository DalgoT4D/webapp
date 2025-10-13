import { backendUrl } from '@/config/constant';
import { getOrgHeaderValue } from '@/utils/common';
import { signOut } from 'next-auth/react';

// Helper to check if we're running in iframe
function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return window.self !== window.top;
  } catch (e) {
    // Cross-origin iframe will throw an error
    return true;
  }
}

// Helper to get auth token
function getAuthToken(session: any): string | undefined {
  // Use NextAuth session token for both embedded and standalone modes
  return session?.user?.token;
}

// Helper to get org header
function getOrgHeader(method: string, path: string): string {
  // Use normal org header logic for both embedded and standalone modes
  // The embed-token authentication should handle org context through proper auth flow
  return getOrgHeaderValue(method, path);
}

// Handle unauthorized errors
function handleUnauthorizedError() {
  const embedded = isEmbedded();

  if (embedded) {
    // In embedded mode, let NextAuth and parent handle re-auth
    console.log('[Child HTTP] Embedded auth failed, letting parent handle re-auth');
    // Don't redirect, parent will handle re-auth
    return;
  }

  // In standalone mode, redirect to login
  console.log('[Child HTTP] Unauthorized access detected. Logging out...');
  signOut({ callbackUrl: '/login', redirect: true });
}

export async function httpGet(session: any, path: string, isJson = true) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken(session)}`,
      'x-dalgo-org': getOrgHeader('GET', path),
    },
  });

  if (response.ok) {
    const message = isJson ? await response.json() : response;
    return message;
  } else {
    if (response.status === 401) {
      handleUnauthorizedError();
      return;
    }
    const error = await response.json();
    throw new Error(error?.detail ? error.detail : 'error', { cause: error });
  }
}

export async function httpPost(session: any, path: string, payload: object) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getAuthToken(session)}`,
      'x-dalgo-org': getOrgHeader('POST', path),
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    if (response.status === 401) {
      handleUnauthorizedError();
      return;
    }
    const error = await response.json();
    throw new Error(error?.detail ? error.detail : 'error', { cause: error });
  }
}

export async function httpPut(session: any, path: string, payload: object) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getAuthToken(session)}`,
      'x-dalgo-org': getOrgHeader('PUT', path),
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    if (response.status === 401) {
      handleUnauthorizedError();
      return;
    }
    const error = await response.json();
    throw new Error(error?.detail ? error.detail : 'error', { cause: error });
  }
}

export async function httpDelete(session: any, path: string) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getAuthToken(session)}`,
      'x-dalgo-org': getOrgHeader('DELETE', path),
    },
  });

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    if (response.status === 401) {
      handleUnauthorizedError();
      return;
    }
    const error = await response.json();
    throw new Error(error?.detail ? error.detail : 'error', { cause: error });
  }
}
