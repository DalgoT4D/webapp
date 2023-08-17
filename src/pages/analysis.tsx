import styles from '@/styles/Home.module.css';
import '@/styles/Home.module.css';
import { Box, Button, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import Script from 'next/script';

export default function Analysis() {
  const globalContext = useContext(GlobalContext);
  const iframeRef: any = useRef();
  const iframeRefHidden: any = useRef();
  const signedInRef = useRef<boolean>();

  useEffect(() => {
    // listen to responses from the iframe
    window?.addEventListener('message', (event) => {
      // console.log('receieved something', event.data);
      const message = event.data;
      if (
        message?.locationStatus &&
        message.locationStatus === '/superset/welcome/'
      ) {
        if (!signedInRef.current) {
          console.log('setting signedIn, and refreshing visible iframe');
          signedInRef.current = true;
        }
      }
      if (message?.locationStatus && message.locationStatus === '/login/') {
        if (signedInRef.current) {
          console.log('setting !signedIn');
          signedInRef.current = false;
        }
      }
    });
    // ask the iframe where it's at
    setInterval(function () {
      if (iframeRefHidden.current) {
        // console.log('asking the iframe for its locationStatus');
        // console.log(globalContext?.CurrentOrg?.state.viz_url);
        if (globalContext?.CurrentOrg?.state.viz_url) {
          iframeRefHidden.current.contentWindow.location.href =
            globalContext?.CurrentOrg?.state.viz_url;
          setTimeout(() => {
            iframeRefHidden.current.contentWindow.postMessage(
              { ask: 'locationStatus' },
              globalContext?.CurrentOrg?.state.viz_url
            );
          }, 500);
        }
      }
    }, 2000);
  }, [globalContext?.CurrentOrg?.state.viz_url]);

  const initiateGoogleSignIn = () => {
    // pop open a separate window here for users to do google auth
    window.open(
      `${globalContext?.CurrentOrg?.state.viz_url}`,
      '_blank',
      'width=500,height=500'
    );
  };

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.analysis}>
        <iframe
          src={`${globalContext?.CurrentOrg?.state.viz_url}superset/welcome/`}
          style={{
            height: '1px',
            width: '1px',
            border: 'none',
            display: 'hidden',
          }}
          ref={iframeRefHidden}
        ></iframe>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
            Analysis
          </Typography>
          {globalContext?.CurrentOrg?.state.viz_login_type === 'google' &&
            !signedInRef.current && (
              <>
                <Button
                  sx={{ height: '50%' }}
                  variant="contained"
                  onClick={initiateGoogleSignIn}
                  id="oauth-signin-button"
                >
                  Google Signin
                </Button>
                <Script id="oauth-script" onLoad={() => {}} />
              </>
            )}
        </Box>

        {globalContext?.CurrentOrg?.state.viz_url && signedInRef.current && (
          <Box sx={{ border: 'none' }}>
            <iframe
              src={`${globalContext?.CurrentOrg?.state.viz_url}superset/welcome/`}
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
