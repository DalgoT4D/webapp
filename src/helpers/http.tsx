import { backendUrl } from '@/config/constant';
import { getOrgHeaderValue } from '@/utils/common';
import { signOut } from 'next-auth/react';
import { getEmbeddedAuth } from '@/middleware/embeddedAuth';

// Helper function to handle 401 errors by clearing session and logging out
function handleUnauthorizedError() {
  // Check if we're in embedded mode
  const embeddedAuth = getEmbeddedAuth();

  if (embeddedAuth) {
    // In embedded mode, don't redirect - just clear the auth
    sessionStorage.clear();
    console.log('Embedded auth failed');
    return;
  }

  console.log('Unauthorized access detected. Logging out...');
  localStorage.clear();
  signOut({ callbackUrl: '/login' });
}

// Helper to get auth token, preferring embedded token when available
function getAuthToken(session: any): string | undefined {
  // Check for embedded auth first
  const embeddedAuth = getEmbeddedAuth();
  if (embeddedAuth?.token) {
    return embeddedAuth.token;
  }

  // Check window object for embedded session
  if (typeof window !== 'undefined' && (window as any).__embeddedSession?.user?.token) {
    return (window as any).__embeddedSession.user.token;
  }

  return session?.user?.token;
}

// Helper to get org header, preferring embedded org when available
function getOrgHeader(method: string, path: string): string {
  // Check for embedded auth first
  const embeddedAuth = getEmbeddedAuth();

  // If we're in embedded mode and have an org, use it
  if (embeddedAuth && embeddedAuth.isEmbedded) {
    // Return the embedded org, or empty string if not set
    return embeddedAuth.org || '';
  }

  // Otherwise use the normal org header logic
  return getOrgHeaderValue(method, path);
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
      await handleUnauthorizedError();
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
      await handleUnauthorizedError();
      return;
    }
    const error = await response.json();
    throw new Error(error?.detail ? error.detail : 'error', { cause: error });
  }
}
