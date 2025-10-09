import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box, Typography } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useParentCommunication } from '@/contexts/ParentCommunicationProvider';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
  viz_url: string | null;
  viz_login_type: string | null;
  is_demo: boolean;
};

type OrgUser = {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  org: Org;
  wtype: string;
  permissions: { slug: string; name: string }[];
};

const MainDashboard = ({ children }: any) => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState<string | null>('');
  const globalContext = useContext(GlobalContext);

  const [openMenu, setOpenMenu] = useState<boolean>(true);
  const [params, setParams] = useState<any>({});
  const [isEmbeddedWithHide, setIsEmbeddedWithHide] = useState<boolean>(false);

  // useEffect(() => {
  //   // Make sure router is ready before accessing query
  //   if (router.isReady) {
  //     setParams(router.query);
  //   }
  // }, [router.isReady, router.query]);

  // useEffect(() => {
  //   // Check if we're in embedded mode with hide=true
  //   const embeddedAuth = getEmbeddedAuth();
  //   if (embeddedAuth && embeddedAuth.hide === 'true') {
  //     setIsEmbeddedWithHide(true);
  //   }
  // }, []);

  const { hideHeader } = useParentCommunication();

  useEffect(() => {
    (async () => {
      try {
        let orgusers = await httpGet(session, `currentuserv2`);
        // if there are no orgs, redirect to create org page
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

        // update orgusers in global state
        orgusers = orgusers.filter((orguser: OrgUser) => orguser.org);
        globalContext?.OrgUsers.dispatch({
          type: 'new',
          orgUsersState: orgusers,
        });

        // see if the org is set in the local storage
        const currentOrgSlug = localStorage.getItem('org-slug');
        let currentOrgUser: OrgUser | null | undefined = null;
        currentOrgUser = orgusers?.find((orguser: OrgUser) => orguser.org.slug === currentOrgSlug);
        // If not pick the first org from the api response
        if (!currentOrgUser && orgusers && orgusers.length > 0) currentOrgUser = orgusers[0];
        // update current org in global state
        globalContext?.CurrentOrg.dispatch({
          type: 'new',
          orgState: { ...currentOrgUser?.org, wtype: currentOrgUser?.wtype },
        });

        // update permissions in global state
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
        fetcher: (resource) => {
          return httpGet(session, resource).then((res) => res);
        },
        revalidateOnFocus: false,
      }}
    >
      {redirectTo === 'setup-account' && (
        <>
          <Header />
          <Typography variant="h2" sx={{ pt: 20, textAlign: 'center' }}>
            Welcome!
          </Typography>
          <Typography variant="h5" sx={{ textAlign: 'center' }}>
            Please contact the Dalgo team to set up your account
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            <a href="mailto:support@dalgo.org">support@dalgo.org</a>
          </Box>
        </>
      )}
      {redirectTo === 'dashboard' && (
        <>
          {router.pathname === '/changepassword' ? (
            children
          ) : hideHeader ? (
            <Box sx={{ display: 'flex' }}>{children}</Box>
          ) : (
            <>
              <Header openMenu={openMenu} setOpenMenu={setOpenMenu} />
              <Box sx={{ display: 'flex', pt: 6 }}>
                <SideDrawer openMenu={openMenu} setOpenMenu={setOpenMenu} />
                {children}
              </Box>
            </>
          )}
        </>
      )}
    </SWRConfig>
  );
};

export const Main = ({ children }: any) => {
  const { data: session }: any = useSession();

  const router = useRouter();

  // Verify email with token should be visible whether the token is there or not
  if (router.pathname === '/verifyemail') return children;

  // invitations page should be accessible with or without the token
  if (router.pathname === '/invitations') return children;

  // if the user is not logged in, return immediately
  if (!session?.user.token) return children;

  // if there are no orgs for the user send to the create org page
  if (router.pathname === '/createorg') return children;

  // User is logged in
  // if the user has not verified email redirect them to email verification page
  if (!session?.user.email_verified) {
    if (router.pathname !== '/verifyemail/resend') {
      router.push('/verifyemail/resend');
    } else {
      return children;
    }
  } else {
    return <MainDashboard>{children}</MainDashboard>;
  }

  return null;
};
