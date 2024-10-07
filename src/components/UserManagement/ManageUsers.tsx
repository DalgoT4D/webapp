import React, { useContext, useMemo, useState } from 'react';
import { List } from '../List/List';
import Image from 'next/image';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ProfileIcon from '@/assets/icons/profile.svg';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  Tooltip,
  Typography,
} from '@mui/material';
import { ActionsMenu } from '../UI/Menu/Menu';
import useSWR from 'swr';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { InfoOutlined } from '@mui/icons-material';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useTracking } from '@/contexts/TrackingContext';

const headers = {
  values: [
    'Email',
    <Box sx={{ display: 'flex', alignItems: 'center' }} key={'tooltip'}>
      <span>Roles</span>
      <Tooltip
        title={
          <Box>
            <Box>
              <strong> Account manager </strong>: Admin of the NGO org, and is also responsible for
              the user management
            </Box>
            <Box>
              <strong>Pipeline manager : </strong> Org team member who is responsible for creating
              pipelines & DBT models
            </Box>
            <Box>
              <strong>Analyst : </strong> M&E team member who will be working on transformation
              models of the org
            </Box>
            <Box>
              <strong>Guest : </strong> The guest is able to view the platform and the usage
              dashboard
            </Box>
          </Box>
        }
        arrow
        sx={{
          cursor: 'pointer',
        }}
      >
        <InfoOutlined sx={{ cursor: 'pointer', fontSize: '16px', ml: 1 }} />
      </Tooltip>
    </Box>,
  ],
};

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
};

type OrgUser = {
  email: string;
  active: boolean;
  role: number;
  role_slug: string;
  new_role_slug: string;
  org: Org;
};

interface ManageUsersInterface {
  setMutateInvitations: (...args: any) => any;
}

const ManageUsers = ({ setMutateInvitations }: ManageUsersInterface) => {
  const { data, isLoading, mutate } = useSWR(`organizations/users`);
  const { data: roles } = useSWR(`data/roles`);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const { data: session }: any = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [editOrgRole, setEditOrgRole] = useState<OrgUser | null>(null);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState<boolean>(false);
  const [orguserSelectedInAction, setOrguserSelectedInAction] = useState<OrgUser | null>(null);
  const trackAmplitudeEvent = useTracking();
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const openActionMenu = Boolean(anchorEl);
  const handleClick = (orguser: OrgUser, event: HTMLElement | null) => {
    setOrguserSelectedInAction(orguser);
    setAnchorEl(event);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleUpdateRole = async () => {
    trackAmplitudeEvent('[Update-Role] Button Clicked');
    try {
      const message = await httpPost(
        session,
        `organizations/user_role/modify/`,

        { toupdate_email: editOrgRole?.email, role_uuid: selectedUserRole }
      );
      if (message.success) {
        successToast('Role updated successfully', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      mutate();
      setEditOrgRole(null);
      setSelectedUserRole('');
      setOrguserSelectedInAction(null);
    }
  };

  const handleEdit = () => {
    setSelectedUserRole(
      roles.find((role: any) => role.slug === orguserSelectedInAction?.new_role_slug).uuid
    );
    setEditOrgRole(orguserSelectedInAction);
    setAnchorEl(null);
  };

  const handleClickDeleteAction = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteOrguser = () => {
    setOrguserSelectedInAction(null);
    setShowConfirmDeleteDialog(false);
  };

  let rows = [];
  rows = useMemo(() => {
    if (data && data.length >= 0) {
      return data.map((orguser: OrgUser, idx: number) => [
        <Box key={'email-' + idx} sx={{ display: 'flex', alignItems: 'center' }}>
          <Image src={ProfileIcon} style={{ marginRight: 10 }} alt="person icon" />
          <Typography variant="body1" fontWeight={600}>
            {orguser.email}
          </Typography>
        </Box>,
        <Box key={'roles'} sx={{ width: '150px' }}>
          {editOrgRole?.email === orguser.email ? (
            <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
              <Select
                label="Role"
                sx={{ ml: -2 }}
                value={selectedUserRole}
                onChange={(event) => setSelectedUserRole(event.target.value)}
              >
                {roles &&
                  roles.map((role: any) => (
                    <MenuItem key={role.uuid} value={role.uuid}>
                      {role.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          ) : (
            <Typography key={'role-' + idx} variant="subtitle2" fontWeight={600}>
              {orguser.new_role_slug
                .replace('-', ' ')
                .replace(/\b\w/g, (char) => char.toUpperCase())}
            </Typography>
          )}
        </Box>,
        <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'action-box-' + idx}>
          {editOrgRole?.email === orguser.email ? (
            <Button variant="contained" onClick={() => handleUpdateRole()}>
              Save
            </Button>
          ) : (
            orguser.email !== session?.user?.email && (
              <Button
                aria-controls={openActionMenu ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={openActionMenu ? 'true' : undefined}
                onClick={(event) => handleClick(orguser, event.currentTarget)}
                variant="contained"
                key={'menu-' + idx}
                color="info"
                sx={{ px: 0, minWidth: 32 }}
              >
                <MoreHorizIcon />
              </Button>
            )
          )}
        </Box>,
      ]);
    }
    return [];
  }, [data, editOrgRole, orguserSelectedInAction, selectedUserRole]);

  const deleteOrgUser = async (orguser: OrgUser | null) => {
    if (orguser) {
      setLoading(true);
      try {
        await httpPost(session, `v1/organizations/users/delete`, {
          email: orguser.email,
        });
        successToast('Organization user deleted successfully', [], globalContext);
        mutate();
        setMutateInvitations(true);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setLoading(false);
    }
    handleCancelDeleteOrguser();
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <ActionsMenu
        eleType="usermanagement"
        anchorEl={anchorEl}
        open={openActionMenu}
        hasEditPermission={permissions.includes('can_edit_orguser')}
        handleClose={handleClose}
        hasDeletePermission={permissions.includes('can_delete_orguser')}
        handleEdit={handleEdit}
        handleDelete={handleClickDeleteAction}
      />
      <List openDialog={() => {}} title="User" headers={headers} rows={rows} onlyList={true} />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteOrguser()}
        handleConfirm={() => deleteOrgUser(orguserSelectedInAction)}
        message="This will delete the organization user permanently. The user will have to be invited again to join the platform"
        loading={loading}
      />
    </>
  );
};

export default ManageUsers;
