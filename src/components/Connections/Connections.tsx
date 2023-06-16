import { useState } from 'react';
import useSWR from 'swr';
import {
  CircularProgress,
  Box,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
} from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import EditIcon from '@/assets/icons/edit.svg';
import DeleteIcon from '@/assets/icons/delete.svg';
import SyncIcon from '@/assets/icons/sync.svg';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpDelete, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import connectionIcon from '@/assets/icons/connection.svg';
import CreateConnectionForm from './CreateConnectionForm';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import Image from 'next/image';
import styles from './Connections.module.css';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [blockId, setBlockId] = useState<string>('');
  const [syncingBlockId, setSyncingBlockId] = useState<string>('');

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (blockId: string, event: HTMLElement | null) => {
    setBlockId(blockId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [connectionToBeDeleted, setConnectionToBeDeleted] = useState<any>(null);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const syncConnection = (blockId: any) => {
    (async () => {
      try {
        const message = await httpPost(
          session,
          `airbyte/connections/${blockId}/sync/`,
          {}
        );
        if (message.success) {
          successToast(
            'Sync started... check for logs in two minutes',
            [],
            toastContext
          );
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setSyncingBlockId('');
      }
    })();
  };

  const deleteConnection = (blockId: any) => {
    (async () => {
      try {
        const message = await httpDelete(
          session,
          `airbyte/connections/${blockId}`
        );
        if (message.success) {
          successToast('Connection deleted', [], toastContext);
          mutate();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
    handleCancelDeleteConnection();
  };

  const Actions = ({ blockId, idx }: any) => (
    <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'box-' + idx}>
      <Button
        variant="contained"
        onClick={() => {
          setSyncingBlockId(blockId);
          syncConnection(blockId);
        }}
        disabled={syncingBlockId === blockId}
        key={'sync-' + idx}
        sx={{ marginRight: '10px' }}
      >
        {syncingBlockId === blockId ? (
          <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
        ) : (
          'Sync'
        )}
      </Button>
      <Button
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => handleClick(blockId, event.currentTarget)}
        variant="contained"
        key={'del-' + idx}
        color="info"
        sx={{ p: 0, minWidth: 32 }}
      >
        <MoreHorizIcon />
      </Button>
    </Box>
  );

  // when the connection list changes
  let rows = [];

  if (data && data.length >= 0) {
    rows = data.map((connection: any, idx: number) => [
      <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
        <Image
          style={{ marginRight: 10 }}
          src={connectionIcon}
          alt="connection icon"
        />
        {connection.name}
      </Box>,
      connection.sourceDest,
      connection.lastSync,
      <Actions key={idx} blockId={connection.blockId} idx={idx} />,
    ]);
  }

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleDeleteConnection = (id: any) => {
    handleClose();
    setConnectionToBeDeleted(id);
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteConnection = () => {
    setConnectionToBeDeleted(null);
    setShowConfirmDeleteDialog(false);
  };

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        slotProps={{
          backdrop: {
            invisible: true,
          },
        }}
        sx={{ marginTop: 2, py: 0 }}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        MenuListProps={{
          sx: { p: 0 },
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem sx={{ my: 0 }} onClick={handleClose}>
          <ListItemIcon style={{ minWidth: 28 }}>
            <Image src={EditIcon} alt="edit icon" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <Divider style={{ margin: 0 }} />
        <MenuItem onClick={() => handleDeleteConnection(blockId)}>
          <ListItemIcon style={{ minWidth: 28 }}>
            <Image src={DeleteIcon} alt="delete icon" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
      <CreateConnectionForm
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteConnection()}
        handleConfirm={() => deleteConnection(connectionToBeDeleted)}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
    </>
  );
};
