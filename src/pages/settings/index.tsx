import { PageHead } from '@/components/PageHead';
import { Typography } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { ServicesInfo } from '@/components/Settings/ServicesInfo';
import { SubscriptionInfo } from '@/components/Settings/SubscriptionInfo';

const Settings = () => {
  return (
    <>
      <PageHead title="Dalgo | Settings" />
      <main className={styles.main}>
        <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
          Settings
        </Typography>
        <SubscriptionInfo />
        <ServicesInfo />
      </main>
    </>
  );
};
export default Settings;
