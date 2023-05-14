import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();

  // if (['/login', '/signup', '/'].includes(router.pathname)) return children;

  // if the user is not logged in, return immediately
  if (!session?.user.token) return children;

  // User is logged in
  if (session?.user?.org) {
    return (
      router.pathname !== '/signup/createorg' && (
        <SWRConfig
          value={{
            fetcher: (resource) =>
              fetch(resource, {
                headers: {
                  Authorization: `Bearer ${session?.user.token}`,
                },
              }).then((res) => res.json()),
          }}
        >
          <Header />
          <Box sx={{ display: 'flex', pt: 6 }}>
            <SideDrawer />
            {children}
          </Box>
        </SWRConfig>
      )
    );
  } else {
    if (router.pathname === '/signup/createorg') return children;
    router.push('/signup/createorg');
  }
};
