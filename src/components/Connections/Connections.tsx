import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Typography } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';

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
import { lastRunTime } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];
const getSourceDest = (connection: any) => (
  <Typography variant="subtitle2" fontWeight={600}>
    {`${connection.source.name} → ${connection.destination.name}`}
  </Typography>
);

const getLastSync = (connection: any) => (
  <Typography variant="subtitle2" fontWeight={600}>
    {lastRunTime(connection?.lastRun?.startTime)}
  </Typography>
);

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
  const [showConfirmResetDialog, setShowConfirmResetDialog] =
    useState<boolean>(false);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const syncConnection = (deploymentId: any) => {
    (async () => {
      if (!deploymentId) {
        errorToast('Deployment not created', [], toastContext);
        return;
      }
      try {
        const response = await httpPost(
          session,
          `prefect/flows/${deploymentId}/flow_run`,
          {}
        );
        if (response?.detail) errorToast(response.detail, [], toastContext);
        else successToast('Sync inititated successfully', [], toastContext);
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

  const resetConnection = (blockId: string) => {
    (async () => {
      try {
        const message = await httpPost(
          session,
          `airbyte/connections/${blockId}/reset`,
          {}
        );
        if (message.success) {
          successToast(
            'Reset connection initiated successfully',
            [],
            toastContext
          );
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
    handleCancelResetConnection();
  };

  const Actions = ({ connection: { blockId, deploymentId }, idx }: any) => (
    <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'sync-' + idx}>
      <Button
        variant="contained"
        onClick={() => {
          setSyncingBlockId(blockId);
          syncConnection(deploymentId);
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
        id={idx}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => handleClick(blockId, event.currentTarget)}
        variant="contained"
        key={'menu-' + idx}
        color="info"
        sx={{ p: 0, minWidth: 32 }}
      >
        <MoreHorizIcon />
      </Button>
    </Box>
  );

  // when the connection list changes
  let rows = [];

  rows = useMemo(() => {
    if (data && data.length >= 0) {
      return data.map((connection: any) => [
        <Box
          key={`name-${connection.blockId}`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Image
            style={{ marginRight: 10 }}
            src={connectionIcon}
            alt="connection icon"
          />
          <Typography variant="body1" fontWeight={600}>
            {connection.name}
          </Typography>
        </Box>,
        getSourceDest(connection),
        getLastSync(connection),

        <Actions
          key={`actions-${connection.blockId}`}
          connection={connection}
          idx={connection.blockId}
        />,
      ]);
    }
    return [];
  }, [data, syncingBlockId]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleDeleteConnection = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteConnection = () => {
    setShowConfirmDeleteDialog(false);
  };

  const handleCancelResetConnection = () => {
    setShowConfirmResetDialog(false);
  };

  const handleResetConnection = () => {
    handleClose();
    setShowConfirmResetDialog(true);
  };

  const handleEditConnection = () => {
    handleClose();
    setShowDialog(true);
  };

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <ActionsMenu
        eleType="connection"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        elementId={blockId}
        handleEdit={handleEditConnection}
        handleDeleteConnection={handleDeleteConnection}
        handleResetConnection={handleResetConnection}
      />
      <CreateConnectionForm
        setBlockId={setBlockId}
        blockId={blockId}
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
        handleConfirm={() => deleteConnection(blockId)}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
      <ConfirmationDialog
        show={showConfirmResetDialog}
        handleClose={() => handleCancelResetConnection()}
        handleConfirm={() => resetConnection(blockId)}
        message="Resetting the connection will clear all data at the warehouse."
      />
    </>
  );
};
