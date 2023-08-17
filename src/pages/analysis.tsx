import styles from '@/styles/Home.module.css';
import '@/styles/Home.module.css';
import { Box, Button, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useContext, useEffect, useRef } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import Script from 'next/script';

export default function Analysis() {
  const globalContext = useContext(GlobalContext);
  const iframeRef: any = useRef();

  useEffect(() => {}, []);

  const initiateGoogleSignIn = () => {
    // pop open a separate window here for users to do google auth
    window.open(
      `${globalContext?.CurrentOrg?.state.viz_url}`,
      '_blank',
      'width=500,height=500'
    );

    // TODO: figure out a way to close the popup once logged in. The solution below works partially
    // var locationStatusInterval = setInterval(() => {
    //   authWindow?.postMessage(
    //     { ask: 'locationStatus' },
    //     `${globalContext?.CurrentOrg?.state.viz_url}/#child`
    //   );
    // }, 2000);

    // window?.addEventListener('message', (event) => {
    //   console.log('receieved something', event.data);
    //   const message = event.data;
    //   if (
    //     message?.locationStatus &&
    //     message.locationStatus === '/superset/welcome/'
    //   ) {
    //     console.log('asking the window to be closed', message.locationStatus);
    //     authWindow?.close();
    //     authWindow = null;
    //     clearInterval(locationStatusInterval);
    //   }
    // });
  };

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.analysis}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
            Analysis
          </Typography>
        </Box>
        {globalContext?.CurrentOrg?.state.viz_login_type === 'google' && (
          <>
            <Button
              sx={{ marginBottom: '20px' }}
              variant="contained"
              onClick={initiateGoogleSignIn}
              id="oauth-signin-button"
            >
              Google Signin
            </Button>
            <Script id="oauth-script" onLoad={() => {}} />
          </>
        )}

        {globalContext?.CurrentOrg?.state.viz_url && (
          <Box sx={{ border: 'none' }}>
            <iframe
              src={`${globalContext?.CurrentOrg?.state.viz_url}`}
              style={{
                height: '70vh',
                width: '100%',
                border: 'none',
              }}
              ref={iframeRef}
            />
          </Box>
        )}
      </main>
    </>
  );
}
