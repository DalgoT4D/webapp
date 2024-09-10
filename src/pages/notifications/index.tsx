import styles from '@/styles/Home.module.css';
import React, { useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { Box, Button, Typography } from '@mui/material';
import ManageNotifications from '@/components/Notifications/ManageNotificaitons';
import PreferencesForm from '@/components/Notifications/PreferencesForm';
import useSWR from 'swr';

const UserManagement = () => {
    const { data: unread_count, mutate } = useSWR(`notifications/unread_count`);
    const [showPreferencesForm, setShowPreferencesForm] = useState<boolean>(false);

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
                <PreferencesForm
                    showForm={showPreferencesForm}
                    setShowForm={setShowPreferencesForm}
                />
            </main>
        </>
    );
};

export default UserManagement;