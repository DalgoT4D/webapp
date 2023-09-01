import { useSession } from 'next-auth/react';
import { SWRConfig } from 'swr';
import { SideDrawer } from '../SideDrawer/SideDrawer';
import { Header } from '../Header/Header';
import { Box } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
  viz_url: string | null;
  viz_login_type: string | null;
};

type OrgUser = {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  org: Org;
};

const MainDashboard = ({ children }: any) => {
  const { data: session }: any = useSession();
  const router = useRouter();
  const [redirectToOrgPage, setRedirectToOrgPage] = useState<boolean | null>(
    null
  );
  const globalContext = useContext(GlobalContext);

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
          setRedirectToOrgPage(true);
          router.push('/createorg');
          return;
        } else {
          setRedirectToOrgPage(false);
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
        currentOrgUser = orgusers?.find(
          (orguser: OrgUser) => orguser.org.slug === currentOrgSlug
        );
        // If not pick the first org from the api response
        if (!currentOrgUser && orgusers && orgusers.length > 0)
          currentOrgUser = orgusers[0];
        // update current org in global state
        globalContext?.CurrentOrg.dispatch({
          type: 'new',
          orgState: currentOrgUser?.org,
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
      }}
    >
      {redirectToOrgPage === false && (
        <>
          <Header />
          <Box sx={{ display: 'flex', pt: 6 }}>
            <SideDrawer />
            {children}
          </Box>
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
    return <MainDashboard children={children} />;
  }

  return null;
};
