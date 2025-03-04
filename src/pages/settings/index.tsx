import { PageHead } from '@/components/PageHead';
import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { ServicesInfo } from '@/components/Settings/ServicesInfo';
import { SubscriptionInfo } from '@/components/Settings/SubscriptionInfo';
import { dalgoWhitelistIps } from '@/config/constant';
import { Circle } from '@mui/icons-material';

const Settings = () => {
  return (
    <>
      <PageHead title="Dalgo | Settings" />
      <main className={styles.main}>
        <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
          Settings
        </Typography>
        <SubscriptionInfo />
        {dalgoWhitelistIps?.length > 0 && (
          <Box
            sx={{
              boxShadow: '0px 4px 8px 0px rgba(9, 37, 64, 0.08)',
              display: 'block',
              borderRadius: '12px',
              mt: '1.5rem',
              padding: '20px 0px 10px 28px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <Typography
              sx={{ fontWeight: 700, fontSize: '20px' }}
              variant="h6"
              gutterBottom
              color="#00897B"
            >
              Dalgo runs on the following IP addresses, please whitelist these in your firewall if
              you need to:
            </Typography>
            <List>
              {dalgoWhitelistIps?.map((ip: string, index: number) => (
                <ListItem key={index} sx={{ padding: '0' }}>
                  <ListItemIcon>
                    <Circle sx={{ color: '#00897B', fontSize: '15px' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={ip}
                    primaryTypographyProps={{
                      sx: {
                        color: '#000',
                        fontSize: '1.125rem',
                      },
                      variant: 'h6',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <ServicesInfo />
      </main>
    </>
  );
};
export default Settings;
