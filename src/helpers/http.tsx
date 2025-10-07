import { backendUrl } from '@/config/constant';
import { getOrgHeaderValue } from '@/utils/common';
import { signOut } from 'next-auth/react';

// Helper function to handle 401 errors by clearing session and logging out
function handleUnauthorizedError() {
  // Check if we're in embedded mode by checking sessionStorage directly
  const storedEmbedToken =
    typeof window !== 'undefined' ? sessionStorage.getItem('embedToken') : null;
  const storedEmbedApp = typeof window !== 'undefined' ? sessionStorage.getItem('embedApp') : null;
  const isEmbedded = !!(storedEmbedToken || storedEmbedApp);

  if (isEmbedded) {
    // In embedded mode, don't redirect - just clear the auth
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
    console.log('Embedded auth failed');
    return;
  }

  console.log('Unauthorized access detected. Logging out...');
  signOut({ callbackUrl: '/login', redirect: true });
}

// Helper to get auth token, preferring embedded token when available
function getAuthToken(session: any): string | undefined {
  // Check for embedded auth first in sessionStorage
  const embedToken = typeof window !== 'undefined' ? sessionStorage.getItem('embedToken') : null;
  if (embedToken) {
    return embedToken;
  }

  return session?.user?.token;
}

// Helper to get org header, preferring embedded org when available
function getOrgHeader(method: string, path: string): string {
  // Check for embedded auth first in sessionStorage
  const embedOrg = typeof window !== 'undefined' ? sessionStorage.getItem('embedOrg') : null;
  const storedEmbedToken =
    typeof window !== 'undefined' ? sessionStorage.getItem('embedToken') : null;
  const storedEmbedApp = typeof window !== 'undefined' ? sessionStorage.getItem('embedApp') : null;
  const isEmbedded = !!(storedEmbedToken || storedEmbedApp);

  // If we're in embedded mode and have an org, use it
  if (embedOrg && isEmbedded) {
    return embedOrg;
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
