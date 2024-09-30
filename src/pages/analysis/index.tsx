import '@/styles/Home.module.css';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import Script from 'next/script';

export default function Analysis() {
  const globalContext = useContext(GlobalContext);
  const iframeRef: any = useRef();
  const iframeRefHidden: any = useRef();
  const [signedIn, setSignedIn] = useState<string>('unknown');

  useEffect(() => {
    // listen to responses from the iframe
    window?.addEventListener('message', (event) => {
      const message = event.data;
      if (message?.locationStatus && message.locationStatus === '/superset/welcome/') {
        if (signedIn !== 'signedIn') {
          setSignedIn('signedIn');
        }
      }
      if (message?.locationStatus && message.locationStatus === '/login/') {
        if (signedIn !== 'signedOut') {
          setSignedIn('signedOut');
        }
      }
    });
    // ask the iframe where it's at
    const intervalId = setInterval(function () {
      if (iframeRefHidden?.current) {
        if (globalContext?.CurrentOrg?.state.viz_url) {
          iframeRefHidden.current.contentWindow.location.href =
            globalContext?.CurrentOrg?.state.viz_url;
          setTimeout(() => {
            iframeRefHidden?.current?.contentWindow?.postMessage(
              { ask: 'locationStatus' },
              globalContext?.CurrentOrg?.state.viz_url
            );
          }, 500);
        }
      }
    }, 2000);
    return () => {
      clearInterval(intervalId);
    };
  }, [globalContext?.CurrentOrg?.state?.viz_url]);

  const initiateGoogleSignIn = () => {
    // pop open a separate window here for users to do google auth
    window.open(`${globalContext?.CurrentOrg?.state.viz_url}`, '_blank', 'width=500,height=500');
  };

  return (
    <>
      <PageHead title="Dalgo | Analysis" />
      <Box sx={{ p: '3rem 4rem', width: '100%' }}>
        {globalContext?.CurrentOrg?.state?.viz_url && (
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
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
            Analysis
          </Typography>
        </Box>
        {!globalContext?.CurrentOrg?.state?.viz_url && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 20 }}>
              <Typography variant="h4" sx={{ alignContent: 'center' }}>
                You have not subscribed to Superset for Visualisation.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Typography variant="h6">
                Please contact the Dalgo team at{' '}
                <a href="mailto:support@dalgo.in">support@dalgo.in</a> for more information
              </Typography>
            </Box>
          </>
        )}
        {globalContext?.CurrentOrg?.state?.viz_login_type === 'google' &&
          signedIn === 'unknown' && (
            <>
              <CircularProgress />
            </>
          )}

        {globalContext?.CurrentOrg?.state?.viz_login_type === 'google' &&
          signedIn === 'signedOut' && (
            <>
              <Button
                sx={{ marginBottom: '15px' }}
                variant="contained"
                onClick={initiateGoogleSignIn}
                id="oauth-signin-button"
              >
                Google Sign In
              </Button>
              <Script id="oauth-script" onLoad={() => {}} />
            </>
          )}

        {globalContext?.CurrentOrg?.state?.viz_login_type === 'google' &&
          signedIn === 'signedIn' && (
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
        {globalContext?.CurrentOrg?.state?.viz_login_type === 'basic' && (
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
      </Box>
    </>
  );
}
