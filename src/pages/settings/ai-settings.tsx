import { PageHead } from '@/components/PageHead';
import { Typography } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { AIEnablePanel } from '@/components/Settings/AI_settings/AiEnablePanel';

const AISettings = () => {
  return (
    <>
      <PageHead title="Dalgo | Settings" />
      <main className={styles.main}>
        <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
          AI Settings
        </Typography>
        <AIEnablePanel />
      </main>
    </>
  );
};
export default AISettings;
