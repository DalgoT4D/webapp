import styles from '@/styles/Home.module.css';
import React, { useContext, useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { Box, Button, Tab, Tabs, Typography } from '@mui/material';
import ManageUsers from '@/components/UserManagement/ManageUsers';
import Invitations from '@/components/Invitations/Invitations';
import InviteUserForm from '@/components/Invitations/InviteUserForm';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useQueryParams } from '@/customHooks/useQueryParams';

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
  const [showInviteUserForm, setShowInviteUserForm] = useState<boolean>(false);
  const [mutateInvitations, setMutateInvitations] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const tabsObj: { [key: string]: number } = {
    users: 0,
    pending_invitations: 1,
  };
  const { value, handleChange } = useQueryParams({
    tabsObj,
    basePath: '/user-management',
    defaultTab: 'users',
  });
  const handleClickInviteUser = () => {
    setShowInviteUserForm(true);
  };
  return (
    <>
      <PageHead title="Dalgo | User Management" />
      <main className={styles.main}>
        <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
          Manage users
        </Typography>
        <Box display="flex" justifyContent="flex-end" marginTop={'10px'}>
          <Button
            data-testid={'invite-user'}
            variant="contained"
            onClick={handleClickInviteUser}
            disabled={!permissions.includes('can_create_invitation')}
          >
            Invite user
          </Button>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: '#DDDDDD' }}>
          <Tabs value={value} onChange={handleChange} aria-label="user-management-tabs">
            <Tab label="Users" sx={{ mr: 4 }} />
            {permissions.includes('can_view_invitations') && <Tab label="Pending Invitations" />}
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <ManageUsers setMutateInvitations={setMutateInvitations} />
        </TabPanel>
        {permissions.includes('can_view_invitations') && (
          <TabPanel value={value} index={1}>
            <Invitations
              mutateInvitationsParent={mutateInvitations}
              setMutateInvitationsParent={setMutateInvitations}
            />
          </TabPanel>
        )}
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
