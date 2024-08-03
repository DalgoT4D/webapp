import styles from '@/styles/Home.module.css';
import React, { useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import ManageNotifications from '@/components/Notifications/ManageNotifications';
import PreferencesForm from '@/components/Notifications/PreferencesForm';
import useSWR from 'swr';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

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

const UserManagement = () => {
    const { data: unread_count, mutate } = useSWR(`notifications/unread_count`);
    // const [value, setValue] = React.useState(0);
    const [showPreferencesForm, setShowPreferencesForm] = useState<boolean>(false);
    // const [mutateInvitations, setMutateInvitations] = useState<boolean>(false);

    // const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    //     setValue(newValue);
    // };

    const handleClick = () => {
        setShowPreferencesForm(true);
    };

    return (
        <>
            <PageHead title="Dalgo | Notifications" />
            <main className={styles.main}>
                <Box display="flex" alignItems='center' gap={2}>
                    <Typography
                        sx={{ fontWeight: 700 }}
                        variant="h4"
                        color="#000"
                    >
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
                <Box display="flex" justifyContent="flex-end" marginTop={'10px'}>
                    <Button
                        data-testid={'invite-user'}
                        variant="contained"
                        onClick={handleClick}
                    >
                        Manage Preferences
                    </Button>
                </Box>
                <ManageNotifications mutateUnreadCount={()=> mutate()} />
                {/* <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
                    <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="user-management-tabs"
                    >
                        <Tab label="All" sx={{ mr: 4 }} />
                        <Tab label="Unread" />
                        <Tab label="Read" />
                    </Tabs>
                </Box>
                <TabPanel value={value} index={0}>
                    <ManageNotifications type="all"  />
                </TabPanel>
                <TabPanel value={value} index={1}>
                    <ManageNotifications type="unread"  />
                </TabPanel>
                <TabPanel value={value} index={2}>
                    <ManageNotifications type="read"  />
                </TabPanel> */}
                <PreferencesForm
                    showForm={showPreferencesForm}
                    setShowForm={setShowPreferencesForm}
                />
            </main>
        </>
    );
};

export default UserManagement;
