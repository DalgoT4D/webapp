import { embedDashboard } from '@superset-ui/embedded-sdk';
import { useContext, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';

export default function Usage() {

  const { data: session }: any = useSession();
  const dashboard_uuid = 'ca6790fd-45ad-4351-accc-63aa5f3cbd95';

  useEffect(() => {
    const mountPoint = document.getElementById('dashboard-container');

    if (mountPoint && 0) {
      (async () => {

        const {embed_token} = await httpPost(
          session,
          `superset/embed_token/${dashboard_uuid}/`,
          {}
        );
        console.log(embed_token);

        embedDashboard({
          id: dashboard_uuid,
          supersetDomain: 'https://superset.dalgo.in',
          mountPoint,
          fetchGuestToken: () => {
            return embed_token
          },
        });
      })();
    }
  }, []);

  return (
    <Box id="dashboard-container" />
  );
}