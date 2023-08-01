import styles from '@/styles/Home.module.css';
import React, { useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import ManageUsers from '@/components/UserManagement/ManageUsers';
import Invitations from '@/components/Invitations/Invitations';
import CustomDialog from '@/components/Dialog/CustomDialog';
import InviteUserForm from '@/components/Invitations/InviteUserForm';

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
  const [value, setValue] = React.useState(0);
  const [showInviteUserForm, setShowInviteUserForm] = useState<boolean>(false);
  const [mutateInvitations, setMutateInvitations] = useState<boolean>(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleClickInviteUser = () => {
    setShowInviteUserForm(true);
  };

  return (
    <>
      <PageHead title="DDP | User Management" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Manage users
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="user-management-tabs"
          >
            <Tab label="Users" sx={{ mr: 4 }} />
            <Tab label="Invitations" />
          </Tabs>
        </Box>
        <Box display="flex" justifyContent="flex-end" marginTop={'10px'}>
          <Button
            data-testid={'invite-user'}
            variant="contained"
            onClick={handleClickInviteUser}
          >
            Invite user
          </Button>
        </Box>
        <TabPanel value={value} index={0}>
          <ManageUsers setMutateInvitations={setMutateInvitations} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Invitations
            mutateInvitationsParent={mutateInvitations}
            setMutateInvitationsParent={setMutateInvitations}
          />
        </TabPanel>
        <InviteUserForm
          mutate={() => console.log('mutate here')}
          showForm={showInviteUserForm}
          setShowForm={setShowInviteUserForm}
        />
      </main>
    </>
  );
};

export default UserManagement;
