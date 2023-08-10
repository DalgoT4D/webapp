import styles from '@/styles/Home.module.css';
import '@/styles/Home.module.css';
import { Box, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';

export default function Analysis() {
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
        <Box sx={{ border: 'none' }}>
          <iframe
            src="http://localhost:8088/login/"
            style={{
              height: '70vh',
              width: '100%',
              border: 'none',
            }}
          />
        </Box>
      </main>
    </>
  );
}
