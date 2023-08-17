import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/router';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();

  // Verify email with token should be visible whether the token is there or not
  if (router.pathname === '/verifyemail' || router.pathname === '/invitations')
    return children;

  if (!session?.user.token)
    // if the user is not logged in, return immediately
    return children;

  // User is logged in
  // if the user has not verified email redirect them to email verification page
  if (!session?.user.email_verified) {
    if (router.pathname !== '/verifyemail/resend') {
      router.push('/verifyemail/resend');
    } else {
      return children;
    }
  } else {
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
  }

  return null;
};
