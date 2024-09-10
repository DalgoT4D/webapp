import styles from '@/styles/Home.module.css';
import React, { useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import ManageNotifications from '@/components/Notifications/ManageNotificaitons';
import PreferencesForm from '@/components/Notifications/PreferencesForm';
import useSWR from 'swr';
import ManageUsers from '@/components/UserManagement/ManageUsers';
import SettingsIcon from '@mui/icons-material/Settings';
import { useQueryParams } from '@/customHooks/useQueryParams';
import { httpPut } from '@/helpers/http';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { useSession } from 'next-auth/react';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
const tabsObj: { [key: string]: number } = {
  all: 0,
  read: 1,
  unread: 2,
};
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}
const NotificationManagement = () => {
  const { data: session }: any = useSession();
  const { data: unread_count, mutate } = useSWR(`notifications/unread_count`);
  const [showPreferencesForm, setShowPreferencesForm] =
    useState<boolean>(false);
  const [checkedRows, setCheckedRows] = useState([]);

  const handleClick = () => {
    setShowPreferencesForm(true);
  };

  const handleMarkAsRead = async () => {
    try {
      await httpPut(session, `notifications/`, {
        //we might send here notification array.
        // notification_id: notification.id,
        // read_status: !notification.read_status,
      });
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      mutate();
    }
  };

  const { value, handleChange } = useQueryParams({
    tabsObj,
    basePath: '/notifications',
    defaultTab: 'all',
  });
  return (
    <>
      <PageHead title="Dalgo | Notifications" />
      <main className={styles.main}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography sx={{ fontWeight: 700 }} variant="h4" color="#000">
            Notifications
          </Typography>
          <Box sx={{ px: 1, py: 0.2, background: '#00897B', borderRadius: 1 }}>
            <Typography
              sx={{ fontWeight: 600 }}
              variant="subtitle1"
              color="#fff"
            >
              {unread_count?.res}
            </Typography>
          </Box>
        </Box>
        <Box
          display="flex"
          justifyContent="flex-end"
          marginTop={'10px'}
          gap="1rem"
        >
          <Button
            data-testid={'invite-user'}
            variant="contained"
            onClick={handleMarkAsRead}
          >
            Mark as read
          </Button>
          <Button
            data-testid={'invite-user'}
            variant="outlined"
            // onClick={handleClick}
          >
            Mark as unread
          </Button>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Tooltip title="Manage Preferences" placement='top'>
              <SettingsIcon
                sx={{ cursor: 'pointer' }}
                onClick={handleClick}
                data-testid={'invite-user'}
              />
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="user-management-tabs"
          >
            <Tab label="all" sx={{ mr: 4 }} />
            <Tab label="read" />
            <Tab label="unread" />
          </Tabs>
        </Box>
        {['all', 'read', 'unread']?.map((item, idx) => {
          return (
            <>
              <TabPanel key={idx} value={value} index={idx}>
                <ManageNotifications
                  checkedRows={checkedRows}
                  setCheckedRows={setCheckedRows}
                  tabWord={item}
                />
              </TabPanel>
            </>
          );
        })}
        <PreferencesForm
          showForm={showPreferencesForm}
          setShowForm={setShowPreferencesForm}
        />
      </main>
    </>
  );
};

export default NotificationManagement;
