import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';

import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();
  const inSignup = router.pathname === '/signup/createorg' || router.pathname === '/signup';

  return (session?.user.token && !inSignup) ? (
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
  ) : (
    children
  );
};
