import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';

export default function Home() {
  return (
    <>
      <Head>
        <title>Development Data Platform</title>
      </Head>
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform
        </Typography>
      </main>
    </>
  );
}
