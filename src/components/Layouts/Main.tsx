import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';
import { getOrgHeaderValue } from '@/utils/common';
import { backendUrl } from '@/config/constant';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();

  // if the user is not logged in, return immediately
  if (!session?.user.token) return children;

  // User is logged in
  if (session?.user?.org) {
    if (router.pathname === '/signup/createorg') {
      router.push('/');
    } else {
      return (
        <SWRConfig
          value={{
            fetcher: (resource) => {
              const org_slug = getOrgHeaderValue('GET', resource);

              return fetch(`${backendUrl}/api/${resource}`, {
                headers: {
                  Authorization: `Bearer ${session?.user.token}`,
                  'x-dalgo-org': org_slug,
                },
              }).then((res) => res.json());
            },
          }}
        >
          <Header />
          <Box sx={{ display: 'flex', pt: 6 }}>
            <SideDrawer />
            {children}
          </Box>
        </SWRConfig>
      );
    }
  } else {
    if (router.pathname === '/signup/createorg') return children;
    router.push('/signup/createorg');
  }

  return null;
};
