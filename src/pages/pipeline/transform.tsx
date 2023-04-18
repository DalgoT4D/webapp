import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';

export default function Transform() {
  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform transform page
        </Typography>
      </main>
    </>
  );
}
