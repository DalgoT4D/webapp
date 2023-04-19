import styles from '@/styles/Home.module.css';
import { Box, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';

export default function Home() {
  return (
    <>
      <PageHead title="Development Data Platform" />

      <main className={styles.main}>
        <Box sx={{ background: '#003D37', p: 4, borderRadius: 4 }}>
          <Typography variant="h4" sx={{ color: 'white' }}>
            Overview
          </Typography>
        </Box>
      </main>
    </>
  );
}
