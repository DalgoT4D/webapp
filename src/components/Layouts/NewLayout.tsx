import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box, Typography } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import V0Header from '../v0/Header/V0Header';
import V0SideDrawer from '../v0/SideDrawer/V0SideDrawer';

// This is a visually distinct layout for demo purposes
const NewMainDashboard = ({ children }: any) => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState<string | null>('');
  const globalContext = useContext(GlobalContext);
  const [openMenu, setOpenMenu] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        let orgusers = await httpGet(session, `currentuserv2`);
        let hasOrg = false;
        if (orgusers && orgusers.length > 0) {
          for (const orguser of orgusers) {
            if (orguser.org !== null) hasOrg = true;
          }
        }
        if (!hasOrg && session?.user?.can_create_orgs) {
          setRedirectTo('createorg');
          router.push('/createorg');
          return;
        }
        if (!hasOrg && !session?.user?.can_create_orgs) {
          setRedirectTo('setup-account');
        } else {
          setRedirectTo('dashboard');
        }
        orgusers = orgusers.filter((orguser: any) => orguser.org);
        globalContext?.OrgUsers.dispatch({
          type: 'new',
          orgUsersState: orgusers,
        });
        const currentOrgSlug = localStorage.getItem('org-slug');
        let currentOrgUser: any = null;
        currentOrgUser = orgusers?.find((orguser: any) => orguser.org.slug === currentOrgSlug);
        if (!currentOrgUser && orgusers && orgusers.length > 0) currentOrgUser = orgusers[0];
        globalContext?.CurrentOrg.dispatch({
          type: 'new',
          orgState: { ...currentOrgUser?.org, wtype: currentOrgUser?.wtype },
        });
        const permissions = currentOrgUser?.permissions.map((permission: any) => permission.slug);
        globalContext?.Permissions.dispatch({
          type: 'add',
          permissionState: permissions,
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }, [session]);

  return (
    <SWRConfig
      value={{
        fetcher: (resource) => httpGet(session, resource).then((res) => res),
        revalidateOnFocus: false,
      }}
    >
      {redirectTo === 'setup-account' && (
        <>
          <V0Header />
          <Typography variant="h2" sx={{ pt: 20, textAlign: 'center' }}>
            Welcome!
          </Typography>
          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            Please contact the Dalgo team to set up your account
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', fontSize: '18px' }}>
            <a href="mailto:support@dalgo.org">support@dalgo.org</a>
          </Box>
        </>
      )}
      {redirectTo === 'dashboard' && (
        <>
          <V0Header />
          <Box sx={{ display: 'flex', pt: 6, background: '#f5f5fa', minHeight: '100vh' }}>
            <V0SideDrawer />
            <Box sx={{ flex: 1, p: 4, background: '#e3f2fd', minHeight: '100vh' }}>{children}</Box>
          </Box>
        </>
      )}
    </SWRConfig>
  );
};

export const NewLayout = ({ children }: any) => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const isNewRoute = router.pathname.startsWith('/new');

  if (router.pathname === '/verifyemail') return children;
  if (router.pathname === '/invitations') return children;
  if (!session?.user.token) return children;
  if (router.pathname === '/createorg') return children;
  if (!session?.user.email_verified) {
    if (router.pathname !== '/verifyemail/resend') {
      router.push('/verifyemail/resend');
    } else {
      return children;
    }
  } else if (isNewRoute) {
    return <NewMainDashboard>{children}</NewMainDashboard>;
  } else {
    if (typeof window !== 'undefined' && router.pathname !== '/new') {
      router.replace('/new');
    }
    return null;
  }
  return null;
};
