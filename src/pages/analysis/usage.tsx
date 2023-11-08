import { embedDashboard } from '@superset-ui/embedded-sdk';
import styles from '@/styles/Home.module.css';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHead } from '@/components/PageHead';
import { httpPost } from '@/helpers/http';
import { usageDashboardId, usageDashboardDomain } from '@/config/constant';

export default function Usage() {
  const { data: session }: any = useSession();

  const fetchEmbedToken = async () => {
    const { embed_token } = await httpPost(
      session,
      `superset/embed_token/${usageDashboardId}/`,
      {}
    );
    return embed_token;
  };

  useEffect(() => {
    if (session?.user?.token) {
      (async () => {
        const embed_token = await fetchEmbedToken();
        const mountHTMLElement: HTMLElement | null = document.getElementById(
          'dashboard-container'
        );
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
      })();
    }
  }, [session]);

  return (
    <>
      <PageHead title="Dalgo" />
      <main className={styles.usage}>
        <div id="dashboard-container"></div>
      </main>
    </>
  );
}
