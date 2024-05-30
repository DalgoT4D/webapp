import React from 'react';
import { PageHead } from '@/components/PageHead';
import styles from '@/styles/Home.module.css';
import { Box, Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function WorkFlows() {
  const router = useRouter();
  return (
    <>
      <PageHead title="Dalgo | Workflows" />
      <main className={styles.main}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
          TODO: This is where you will select the worflow and do the initial
          setup
          <Button
            variant="contained"
            sx={{ width: '50%', mb: 2, minHeight: '50px' }}
            type="submit"
            data-testid="go-to-workflow"
            onClick={(e) => {
              e.preventDefault();
              router.push('/workflow/editor');
            }}
          >
            Go to Workflow
          </Button>
        </Box>
      </main>
    </>
  );
}
