import styles from '@/styles/Home.module.css';
import { Box, Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { ConnectionSyncLogsProvider } from '@/contexts/ConnectionSyncLogsContext';
import UnifiedIngestionView from '@/components/Ingest/UnifiedIngestionView';
import { colors } from '@/components/Ingest/ingestStyles';

export default function Ingest() {
  return (
    <>
      <PageHead title="Dalgo | Data Pipeline" />
      <main className={styles.main}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 0.5 }}>
            Your Data Pipeline
          </Typography>
          <Typography variant="body1" sx={{ color: colors.textSecondary }}>
            Bring your data together in one place
          </Typography>
        </Box>
        <ConnectionSyncLogsProvider>
          <UnifiedIngestionView />
        </ConnectionSyncLogsProvider>
      </main>
    </>
  );
}
