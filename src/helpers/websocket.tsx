import { websocketUrl } from '@/config/constant';
import { getOrgHeaderValue } from '@/utils/common';

export const generateWebsocketUrl = (relative_url: string, session: any) => {
  // Try multiple token locations - the key fix for embed token authentication
  const token = session?.user?.token;
  const orgslug = getOrgHeaderValue('GET', relative_url);

  const queryParams: {
    token: string;
    orgslug: string;
    [key: string]: string;
  } = {
    token: token,
    orgslug: orgslug,
  };

  const queryString = Object.keys(queryParams)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
  const urlWithParams = `${websocketUrl}/wss/${relative_url}?${queryString}`;

  return urlWithParams;
};
