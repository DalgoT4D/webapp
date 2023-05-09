import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';

import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  return session?.user.token ? (
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
