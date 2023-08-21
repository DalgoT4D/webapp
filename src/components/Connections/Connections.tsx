import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  CircularProgress,
  Box,
  Typography,
  Card,
  CardActions,
  IconButton,
  Collapse,
  CardContent,
} from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';

import SyncIcon from '@/assets/icons/sync.svg';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
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
import { delay, lastRunTime } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type PrefectFlowRun = {
  id: string;
  name: string;
  deployment_id: string;
  flow_id: string;
  state_type: string;
  state_name: string;
};

type PrefectFlowRunLog = {
  level: number;
  timestamp: string;
  message: string;
};

const headers = [
  'Connection details',
  'Source → Destination',
  'Last manual sync',
];
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
  const [syncLogs, setSyncLogs] = useState<Array<string>>([]);
  const [expandSyncLogs, setExpandSyncLogs] = useState<boolean>(false);

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

  const { data, isLoading, mutate } = useSWR(`airbyte/connections`);

  const fetchFlowRunStatus = async (flow_run_id: string) => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}`
      );

      if (!flowRun.state_type) return 'FAILED';

      return flowRun.state_type;
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flow_run_id: string) => {
    try {
      const response = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}/logs`
      );
      if (response?.logs?.logs && response.logs.logs.length > 0) {
        const logsArray = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) =>
            `- ${logObject.message} '\n'`
        );

        setSyncLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const syncConnection = (deploymentId: any) => {
    (async () => {
      setExpandSyncLogs(true);
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

        // if flow run id is not present, something went wrong
        if (!response?.flow_run_id) {
          errorToast('Something went wrong', [], toastContext);
          return;
        }

        // Poll and show logs till flow run is either completed or failed
        let flowRunStatus: string = await fetchFlowRunStatus(
          response.flow_run_id
        );

        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await delay(5000);
          await fetchAndSetFlowRunLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
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
        data-testid={'sync-' + idx}
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
        handleEdit={handleEditConnection}
        handleDelete={handleDeleteConnection}
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
      <Card
        sx={{
          marginTop: '10px',
          padding: '4px',
          borderRadius: '8px',
          color: '#092540',
        }}
      >
        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>Logs</Box>
          <IconButton onClick={() => setExpandSyncLogs(!expandSyncLogs)}>
            <ExpandMoreIcon
              sx={{
                transform: !expandSyncLogs ? 'rotate(0deg)' : 'rotate(180deg)',
              }}
            />
          </IconButton>
        </CardActions>
        <Collapse in={expandSyncLogs} unmountOnExit>
          {
            <CardContent>
              {syncLogs?.map((logMessage, idx) => (
                <Box key={idx}>{logMessage}</Box>
              ))}
            </CardContent>
          }
        </Collapse>
      </Card>
    </>
  );
};
