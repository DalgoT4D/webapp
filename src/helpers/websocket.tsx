import { websocketUrl } from '@/config/constant';
import { getOrgHeaderValue } from '@/utils/common';

export const generateWebsocketUrl = (relative_url: string, session: any) => {
  const queryParams: {
    token: string;
    orgslug: string;
    [key: string]: string;
  } = {
    token: session?.user.token,
    orgslug: getOrgHeaderValue('GET', relative_url),
  };
  const queryString = Object.keys(queryParams)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
    .join('&');
  const urlWithParams = `${websocketUrl}/wss/${relative_url}?${queryString}`;

  return urlWithParams;
};
