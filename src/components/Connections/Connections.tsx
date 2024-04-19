import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Typography, Tooltip } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';

import SyncIcon from '@/assets/icons/sync.svg';
import LockIcon from '@mui/icons-material/Lock';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
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
import styles from '@/styles/Common.module.css';
import { delay, lastRunTime, trimEmail } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import { LogCard } from '@/components/Logs/LogCard';

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

type Source = {
  connectionConfiguration: object;
  name: string;
  icon: string;
  sourceDefinitionId: string;
  sourceId: string;
  sourceName: string;
  workspaceId: string;
};

type Destination = {
  connectionConfiguration: object;
  name: string;
  icon: string;
  destinationDefinitionId: string;
  destinationId: string;
  destinationName: string;
  workspaceId: string;
};

export type Connection = {
  name: string;
  connectionId: string;
  deploymentId: string;
  catalogId: string;
  destination: Destination;
  source: Source;
  lock: { lockedBy: string | null; lockedAt: string | null } | null;
  lastRun: null | any;
  isRunning: boolean;
  normalize: boolean;
  status: string;
  syncCatalog: object;
};

const truncateString = (input: string) => {
  const maxlength = 20;
  if (input.length <= maxlength) {
    return input;
  }
  return input.substring(0, maxlength - 3) + '...';
};

const headers = ['Connection details', 'Source → Destination', 'Last sync'];
const isSortable = [true, false, false]; // connection details is a sortable column

const getSourceDest = (connection: Connection) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'left',
      justifyContent: 'start',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'left',
        mr: 2,
      }}
    >
      <Tooltip title={connection.source?.name}>
        <Typography variant="subtitle2" fontWeight={600}>
          {truncateString(connection.source.name)}
        </Typography>
      </Tooltip>
      <Tooltip title={connection.source.sourceName}>
        <Typography variant="subtitle2" fontWeight={400}>
          {truncateString(connection.source.sourceName)}
        </Typography>
      </Tooltip>
    </Box>
    <Typography variant="subtitle2" fontWeight={600}>
      →
    </Typography>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'left',
        ml: 2,
      }}
    >
      <Tooltip title={connection.destination.name}>
        <Typography variant="subtitle2" fontWeight={600}>
          {truncateString(connection.destination.name)}
        </Typography>
      </Tooltip>
      <Tooltip title={connection.destination.destinationName}>
        <Typography variant="subtitle2" fontWeight={400}>
          {truncateString(connection.destination.destinationName)}
        </Typography>
      </Tooltip>
    </Box>
  </Box>
);

export const Connections = () => {
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  // const [blockId, setBlockId] = useState<string>('');
  const [connectionId, setConnectionId] = useState<string>('');
  // const [syncingBlockId, setSyncingBlockId] = useState<string>('');
  const [syncingConnectionId, setSyncingConnectionId] = useState<string>('');
  const [syncLogs, setSyncLogs] = useState<Array<string>>([]);
  const [expandSyncLogs, setExpandSyncLogs] = useState<boolean>(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (connectionId: string, event: HTMLElement | null) => {
    setConnectionId(connectionId);
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
  const [rows, setRows] = useState<Array<any>>([]);
  const [rowValues, setRowValues] = useState<Array<Array<any>>>([]);

  const { data, isLoading, mutate } = useSWR(`airbyte/v1/connections`);

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

  function removeEscapeSequences(log: string) {
    // This regular expression matches typical ANSI escape codes
    return log.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
  }

  const fetchAirbyteLogs = async (connectionId: string) => {
    try {
      const response = await httpGet(
        session,
        `airbyte/v1/connections/${connectionId}/jobs`
      );
      const formattedLogs: Array<string> = [];
      if (response.status === 'not found') {
        formattedLogs.push('No logs found');
        setSyncLogs(formattedLogs);
        return response.status;
      }
      response.logs.forEach((log: string) => {
        log = removeEscapeSequences(log);
        const pattern1 = /\)[:;]\d+ -/;
        const pattern2 = /\)[:;]\d+/;
        let match = log.match(pattern1);
        let index = 0;
        if (match?.index) {
          index = match.index + match[0].length;
        } else {
          match = log.match(pattern2);
          if (match?.index) {
            index = match.index + match[0].length;
          }
        }
        formattedLogs.push(log.slice(index));
      });
      setSyncLogs(formattedLogs);
      return response.status;
    } catch (err: any) {
      console.error(err);
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
            `${logObject.message} '\n'`
        );

        setSyncLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const syncConnection = (deploymentId: string) => {
    (async () => {
      setExpandSyncLogs(true);
      if (!deploymentId) {
        errorToast('Deployment not created', [], toastContext);
        return;
      }
      try {
        const response = await httpPost(
          session,
          `prefect/v1/flows/${deploymentId}/flow_run/`,
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
        setSyncingConnectionId('');
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setSyncingConnectionId('');
      }
    })();
  };

  const deleteConnection = (connectionId: string) => {
    (async () => {
      try {
        const message = await httpDelete(
          session,
          `airbyte/v1/connections/${connectionId}`
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

  const resetConnection = (connectionId: string) => {
    (async () => {
      try {
        const message = await httpPost(
          session,
          `airbyte/v1/connections/${connectionId}/reset`,
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

  const Actions = ({
    connection: { connectionId, deploymentId },
    idx,
  }: any) => (
    <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'sync-' + idx}>
      <Button
        variant="contained"
        onClick={() => {
          setSyncingConnectionId(connectionId);
          syncConnection(deploymentId);
        }}
        data-testid={'sync-' + idx}
        disabled={syncingConnectionId === connectionId}
        key={'sync-' + idx}
        sx={{ marginRight: '10px' }}
      >
        {syncingConnectionId === connectionId ? (
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
        onClick={(event) => handleClick(connectionId, event.currentTarget)}
        variant="contained"
        key={'menu-' + idx}
        color="info"
        sx={{ p: 0, minWidth: 32 }}
      >
        <MoreHorizIcon />
      </Button>
    </Box>
  );
  const getLastSync = (connection: Connection) =>
    connection.isRunning ? (
      <CircularProgress />
    ) : connection.lock ? (
      <LockIcon />
    ) : syncingConnectionId ? (
      <Typography variant="subtitle2" fontWeight={600}>
        {lastRunTime(connection?.lastRun?.startTime)}
      </Typography>
    ) : (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {lastRunTime(connection?.lastRun?.startTime)}
        </Typography>
        {connection?.lastRun?.status &&
          (connection?.lastRun?.status == 'COMPLETED' ? (
            <Box
              data-testid={'connectionstate-success'}
              sx={{
                display: 'flex',
                color: '#399D47',
                gap: '3px',
                alignItems: 'center',
              }}
            >
              <TaskAltIcon
                sx={{
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: 'large',
                }}
              />
              <Typography component="p" fontWeight={700}>
                Success
              </Typography>
            </Box>
          ) : (
            <Box
              data-testid={'connectionstate-failed'}
              sx={{
                display: 'flex',
                color: '#981F1F',
                gap: '3px',
                alignItems: 'center',
              }}
            >
              <WarningAmberIcon
                sx={{
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: 'large',
                }}
              />
              <Typography component="p" fontWeight={700}>
                Failed
              </Typography>
            </Box>
          ))}
        <Button
          onClick={() => {
            fetchAirbyteLogs(connection.connectionId);
            setExpandSyncLogs(true);
          }}
        >
          Fetch Logs
        </Button>
      </Box>
    );

  const updateRows = (data: any) => {
    if (data && data.length > 0) {
      const tempRows = data.map((connection: any) => [
        <Box
          key={`name-${connection.blockId}`}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Image
            style={{ marginRight: 10 }}
            src={connectionIcon}
            alt="dbt icon"
          />
          <Typography variant="body1" fontWeight={600}>
            {connection.name}
          </Typography>
        </Box>,
        getSourceDest(connection),
        getLastSync(connection),

        connection.lock ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'end',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                alignItems: 'start',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Triggered by: {trimEmail(connection.lock.lockedBy)}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {lastRunTime(connection.lock.lockedAt)}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Actions
            key={`actions-${connection.blockId}`}
            connection={connection}
            idx={connection.blockId}
          />
        ),
      ]);

      const tempRowValues = data.map((connection: any) => [
        connection.name, // as we are only sorting by connection name...
        null,
        null,
      ])

      setRows(tempRows);
      setRowValues(tempRowValues);
    }
  };

  // when the connection list changes
  useMemo(() => {
    (async () => {
      // check if any connection is locked or not
      let isLocked: boolean = data?.some((conn: any) => conn.lock);

      updateRows(data);

      while (isLocked) {
        try {
          const data = await httpGet(session, 'airbyte/v1/connections');
          isLocked = data?.some((conn: any) => (conn.lock ? true : false));
          await delay(3000);
          updateRows(data);
        } catch (error) {
          isLocked = false;
        }
      }
    })();
  }, [data, syncingConnectionId]);

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
        setConnectionId={setConnectionId}
        connectionId={connectionId}
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
        rowValues={rowValues}
        isSortable={isSortable}
      />
      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteConnection()}
        handleConfirm={() => deleteConnection(connectionId)}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
      <ConfirmationDialog
        show={showConfirmResetDialog}
        handleClose={() => handleCancelResetConnection()}
        handleConfirm={() => resetConnection(connectionId)}
        message="Resetting the connection will clear all data at the warehouse."
      />
      <LogCard
        logs={syncLogs}
        expand={expandSyncLogs}
        setExpand={setExpandSyncLogs}
      />
    </>
  );
};
