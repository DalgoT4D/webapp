import React, { useMemo, useState } from 'react';
import { ActionsMenu } from '../UI/Menu/Menu';
import { List } from '../List/List';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, Button, Typography } from '@mui/material';
import useSWR from 'swr';
import moment from 'moment';
import { backendUrl } from '@/config/constant';

const headers = ['Email', 'Role', 'Status', 'Sent On'];

const Invitations = () => {
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/users/invitations/`
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openActionMenu = Boolean(anchorEl);
  const handleClick = (sourceId: string, event: HTMLElement | null) => {
    // setSourceIdToEdit(sourceId);
    // setSourceToBeDeleted(sourceId);
    setAnchorEl(event);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  let rows = [];
  rows = useMemo(() => {
    if (data && data.length > 0) {
      return data.map((invitation: any, idx: number) => [
        <Typography key={'email-' + idx} variant="body1" fontWeight={600}>
          {invitation.invited_email}
        </Typography>,
        <Typography key={'role-' + idx} variant="subtitle2" fontWeight={600}>
          {invitation.invited_role_slug.replace('_', ' ')}
        </Typography>,
        <Typography key={'status-' + idx} variant="subtitle2" fontWeight={600}>
          {invitation.status}
        </Typography>,
        <Typography key={'status-' + idx} variant="subtitle2" fontWeight={600}>
          {moment
            .utc(invitation.invited_on)
            .local()
            .format('Do MMM hh:mm A')
            .toString()}
        </Typography>,
        <Box
          sx={{ justifyContent: 'end', display: 'flex' }}
          key={'action-box-' + idx}
        >
          {invitation.status !== 'accepted' && (
            <Button
              aria-controls={openActionMenu ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openActionMenu ? 'true' : undefined}
              onClick={(event) =>
                handleClick('enter the user id here', event.currentTarget)
              }
              variant="contained"
              key={'menu-' + idx}
              color="info"
              sx={{ px: 0, minWidth: 32 }}
            >
              <MoreHorizIcon />
            </Button>
          )}
        </Box>,
      ]);
    }
    return [];
  }, [data]);

  const idx = 1;
  const rows1 = [[]];

  return (
    <>
      <ActionsMenu
        eleType="invitation"
        anchorEl={anchorEl}
        open={openActionMenu}
        handleClose={handleClose}
        handleDelete={() => console.log('delete for action menu')}
      />
      <List
        openDialog={() => {}}
        title=""
        headers={headers}
        rows={rows}
        onlyList={true}
      />
    </>
  );
};

export default Invitations;
