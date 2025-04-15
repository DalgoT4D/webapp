import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActionsMenu } from '../UI/Menu/Menu';
import { List } from '../List/List';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import useSWR from 'swr';
import moment from 'moment';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import { httpDelete, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

const headers = {
  values: ['Email', 'Role', 'Sent On'],
};

type InvitedRole = {
  uuid: string;
  name: string;
};

type Invitation = {
  id: number;
  invited_email: string;
  invited_role: InvitedRole;
  invited_on: string;
};

interface InvitationsInterface {
  mutateInvitationsParent: boolean;
  setMutateInvitationsParent: (...args: any) => any;
}

const Invitations = ({
  mutateInvitationsParent,
  setMutateInvitationsParent,
}: InvitationsInterface) => {
  const { data, isLoading, mutate } = useSWR(`v1/users/invitations/`);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const { data: session }: any = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState<boolean>(false);
  const [showConfirmResendialog, setShowConfirmResendialog] = useState<boolean>(false);
  const [invitationToBeDeleted, setInvitationToBeDeleted] = useState<Invitation | null>(null);
  const [invitationToBeResent, setInvitationToBeResent] = useState<Invitation | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const openActionMenu = Boolean(anchorEl);
  const handleClick = (invitation: Invitation, event: HTMLElement | null) => {
    setInvitationToBeResent(invitation);
    setInvitationToBeDeleted(invitation);
    setAnchorEl(event);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleClickDeleteAction = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleClickResendAction = () => {
    handleClose();
    // resendInvitation(invitationToBeResent);
    setShowConfirmResendialog(true);
  };

  useEffect(() => {
    if (mutateInvitationsParent) {
      mutate();
      setMutateInvitationsParent(false);
    }
  }, [mutateInvitationsParent]);

  const handleCancelDeleteInvitation = () => {
    setInvitationToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  const handleCancelResendInvitation = () => {
    setInvitationToBeResent(null);
    setShowConfirmResendialog(false);
  };

  useEffect(() => {
    console.log('data', data);
    if (data && data.length > 0) {
      setRows(
        data.map((invitation: Invitation, idx: number) => [
          <Typography key={'email-' + idx} variant="body1" fontWeight={600}>
            {invitation.invited_email}
          </Typography>,
          <Typography key={'role-' + idx} variant="subtitle2" fontWeight={600}>
            {invitation.invited_role.name}
          </Typography>,
          <Typography key={'sent-on-' + idx} variant="subtitle2" fontWeight={600}>
            {moment.utc(invitation.invited_on).local().format('Do MMM hh:mm A').toString()}
          </Typography>,
          <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'action-box-' + idx}>
            <Button
              aria-controls={openActionMenu ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openActionMenu ? 'true' : undefined}
              onClick={(event) => handleClick(invitation, event.currentTarget)}
              variant="contained"
              key={'menu-' + idx}
              color="info"
              sx={{ px: 0, minWidth: 32 }}
            >
              <MoreHorizIcon />
            </Button>
          </Box>,
        ])
      );
    }
  }, [data]);

  const deleteInvitation = async (invitation: Invitation | null) => {
    if (invitation) {
      setLoading(true);
      try {
        await httpDelete(session, `users/invitations/delete/${invitation.id}`);
        successToast('Invitation rescinded successfully', [], globalContext);
        mutate();
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setLoading(false);
    }
    handleCancelDeleteInvitation();
  };

  const resendInvitation = async (invitation: Invitation | null) => {
    if (invitation) {
      setLoading(true);
      try {
        await httpPost(session, `users/invitations/resend/${invitation.id}`, {});
        successToast('Invitation sent again', [], globalContext);
        mutate();
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setLoading(false);
    }
    handleCancelResendInvitation();
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <ActionsMenu
        eleType="invitation"
        anchorEl={anchorEl}
        open={openActionMenu}
        hasDeletePermission={permissions.includes('can_delete_invitation')}
        hasResendPermission={permissions.includes('can_resend_email_verification')}
        handleClose={handleClose}
        handleDelete={handleClickDeleteAction}
        handleResendInvitation={handleClickResendAction}
      />
      <List
        openDialog={() => {}}
        title="invitations"
        headers={headers}
        rows={rows}
        onlyList={true}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteInvitation()}
        handleConfirm={() => deleteInvitation(invitationToBeDeleted)}
        message="The invitation sent to this user becomes invalid."
        loading={loading}
      />
      <ConfirmationDialog
        show={showConfirmResendialog}
        handleClose={() => handleCancelResendInvitation()}
        handleConfirm={() => resendInvitation(invitationToBeResent)}
        message="The will trigger another invitation email to the user."
        loading={loading}
      />
    </>
  );
};

export default Invitations;
