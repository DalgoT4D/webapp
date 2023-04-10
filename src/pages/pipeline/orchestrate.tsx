import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';

export default function Orchestrate() {
  return (
    <>
      <Head>
        <title>Data development platform</title>
      </Head>
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform orchestrate page
        </Typography>
      </main>
    </>
  );
}
