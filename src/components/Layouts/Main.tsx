import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';
import { httpGet } from '@/helpers/http';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  // if the user is not logged in, return immediately
  if (!session?.user.token) return children;

  // User is logged in
  return (
    <SWRConfig
      value={{
        fetcher: (resource) => {
          return httpGet(session, resource).then((res) => res);
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
};
