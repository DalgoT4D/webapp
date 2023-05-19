import { backendUrl } from '@/config/constant';
// import { useSession } from 'next-auth/react';

export async function httpGet(session: any, path: string) {

  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
    },
  })

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    const error = await response.json();
    throw new Error(error);
  }
}

export async function httpPost(session: any, path: string, payload: object) {

  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
    },
    body: JSON.stringify(payload),
  })

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    const error = await response.json();
    throw new Error(error);
  }
}

export async function httpDelete(session: any, path: string) {

  const response = await fetch(`${backendUrl}/api/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session?.user.token}`,
    },
  })

  if (response.ok) {
    const message = await response.json();
    return message;
  } else {
    const error = await response.json();
    throw new Error(error);
  }
}
