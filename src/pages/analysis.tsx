import styles from '@/styles/Home.module.css';
import '@/styles/Home.module.css';
import { Box, Button, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useContext, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';

export default function Analysis() {
  const globalContext = useContext(GlobalContext);

  const initiateGoogleSignIn = () => {
    // pop open a separate window here for users to do google auth
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
          {globalContext?.CurrentOrg?.state.viz_login_type === 'google' && (
            <Button
              sx={{ height: '50%' }}
              variant="contained"
              onClick={initiateGoogleSignIn}
            >
              Google Signin
            </Button>
          )}
        </Box>

        {globalContext?.CurrentOrg?.state.viz_url && (
          <Box sx={{ border: 'none' }}>
            <iframe
              src={globalContext?.CurrentOrg?.state.viz_url}
              style={{
                height: '70vh',
                width: '100%',
                border: 'none',
              }}
            />
          </Box>
        )}
      </main>
    </>
  );
}
