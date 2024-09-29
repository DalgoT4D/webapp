import { embedDashboard } from '@superset-ui/embedded-sdk';
import styles from '@/styles/Home.module.css';
import { useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHead } from '@/components/PageHead';
import { httpPost } from '@/helpers/http';
import { usageDashboardId, usageDashboardDomain } from '@/config/constant';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { Box, Typography } from '@mui/material';

export default function Usage() {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const fetchEmbedToken = async () => {
    try {
      const { embed_token } = await httpPost(
        session,
        `superset/embed_token/${usageDashboardId}/`,
        {}
      );
      return embed_token;
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  useEffect(() => {
    if (session?.user?.token) {
      (async () => {
        const embed_token = await fetchEmbedToken();
        const mountHTMLElement: HTMLElement | null = document.getElementById(
          'dashboard-container'
        );
        if (mountHTMLElement && embed_token) {
          embedDashboard({
            id: usageDashboardId || '',
            supersetDomain: usageDashboardDomain || '',
            mountPoint: mountHTMLElement,
            fetchGuestToken: () => embed_token,
            dashboardUiConfig: {
              // dashboard UI config: hideTitle, hideTab, hideChartControls, filters.visible, filters.expanded (optional)
              hideTitle: true,
              filters: {
                expanded: true,
              },
            },
          });
        }
      })();
    }
  }, [session]);

  return (
    <>
      <PageHead title="Dalgo | Usage" />
      <main className={styles.usage}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
            Usage Dashboard
          </Typography>
        </Box>
        {!globalContext?.CurrentOrg?.state?.viz_url ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <Typography variant="h4" sx={{ alignContent: 'center' }}>
                You have not subscribed to Superset for Visualisation.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Typography variant="h6">
                Please contact the Dalgo team at{' '}
                <a href="mailto:support@dalgo.in">support@dalgo.in</a> for more
                information
              </Typography>
            </Box>
          </>
        ) : (
          <div
            id="dashboard-container"
            className={styles.embeddedsuperset}
          ></div>
        )}
      </main>
    </>
  );
}
