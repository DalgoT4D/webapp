import { backendUrl } from '@/config/constant';
// import { useSession } from 'next-auth/react';
import { getOrgHeaderValue } from '@/utils/common';
import { signOut, useSession } from 'next-auth/react';

// Helper function to handle 401 errors by clearing session and logging out
function handleUnauthorizedError() {
  console.log('Unauthorized access detected. Logging out...');
  localStorage.clear();
  signOut({ callbackUrl: '/login' });
}

export async function httpGet(session: any, path: string, isJson = true) {
  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
      'x-dalgo-org': getOrgHeaderValue('GET', path),
    },
  });

  console.log('HTTP GET request:', response.status);
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
      Authorization: `Bearer ${session?.user.token}`,
      'x-dalgo-org': getOrgHeaderValue('POST', path),
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
      Authorization: `Bearer ${session?.user.token}`,
      'x-dalgo-org': getOrgHeaderValue('PUT', path),
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
      Authorization: `Bearer ${session?.user.token}`,
      'x-dalgo-org': getOrgHeaderValue('DELETE', path),
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
