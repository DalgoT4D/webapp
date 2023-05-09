import { Box, Grid, Paper } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { DBTSetup } from '@/components/DBT/DBTSetup';

export default function Transform() {

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform transform page
        </Typography>
        <Box className={styles.Container}>
          <Grid container columns={5}>
            <Grid item xs={8}>
              <Paper elevation={3} sx={{ p: 4 }}>
                <DBTSetup />
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </main>
    </>
  );
}
