import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';

export default function Orchestrate() {
  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform orchestrate page
        </Typography>
      </main>
    </>
  );
}
