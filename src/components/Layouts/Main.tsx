import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { useRouter } from 'next/router';
import { backendUrl } from '@/config/constant';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';
import { useState } from 'react';

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();
  // three states:
  // 1. don't know whether there is an org or not: render children without sidebar
  // 2. there is an org - render sidebar + children
  // 3. no org - redirect to /signup/createorg
  const [hasOrg, setHasOrg] = useState<string>('before-check');

  // if the user is not logged in, return immediately
  if (!session?.user.token)
    return children;

  // else we check for the org. while we're checking, we will render any 
  // children WITHOUT the sidebar
  // THIS GETS CALLED ON EVERY PAGE RENDER! WE NEED TO STORE THE ORG STATE SOMEWHERE
  (async () => {
    await fetch(`${backendUrl}/api/currentuser`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {
      if (response.ok) {
        response.json().then((message) => {
          if (message.org) {
            setHasOrg("has-org");
          } else {
            setHasOrg('no-org');
          }
        })
      } else {
        // server didn't tell us! we actually don't know whether there is an org or not
        setHasOrg('no-org');
      }
    });
  })();

  if (hasOrg === 'before-check') {
    return children;

  } else if (hasOrg === 'no-org') {
    if (router.pathname !== '/signup/createorg') {
      router.push('/signup/createorg');
      return;

    } else {
      return children;
    }

  } else {
    // assert(hasOrg === 'yes-org');
    if (router.pathname === '/signup/createorg') {
      router.push('/');
      return;
    }

    return (
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
    );
  }
};
