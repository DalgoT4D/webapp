import styles from '@/styles/Home.module.css';
import '@/styles/Home.module.css';
import { Box, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';

export default function Analysis() {
  const globalContext = useContext(GlobalContext);

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.analysis}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Analysis
        </Typography>
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
