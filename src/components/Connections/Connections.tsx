import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  CircularProgress,
  Box,
  Typography,
  Tooltip,
  SxProps,
} from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import SyncIcon from '@/assets/icons/sync.svg';
import LockIcon from '@mui/icons-material/Lock';
import LoopIcon from '@mui/icons-material/Loop';
import ScheduleIcon from '@mui/icons-material/Schedule';
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
import { TaskLock } from '../Flows/Flows';
import {
  useConnSyncLogs,
  useConnSyncLogsUpdate,
} from '@/contexts/ConnectionSyncLogsContext';
import PendingActionsAccordion from './PendingActions';

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
  lock: TaskLock | null;
  lastRun: null | any;
  normalize: boolean;
  status: string;
  syncCatalog: object;
  resetConnDeploymentId: string;
};

const truncateString = (input: string) => {
  const maxlength = 20;
  if (input.length <= maxlength) {
    return input;
  }
  return input.substring(0, maxlength - 3) + '...';
};

const headers = {
  values: ['Connection details', 'Source → Destination', 'Last sync'],
  sortable: [true, false, false],
};

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
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const [connectionId, setConnectionId] = useState<string>('');
  const [resetDeploymentId, setResetDeploymentId] = useState<string>('');
  const [syncingConnectionIds, setSyncingConnectionIds] = useState<
    Array<string>
  >([]);
  const syncLogs = useConnSyncLogs();
  const setSyncLogs = useConnSyncLogsUpdate();
  const [expandSyncLogs, setExpandSyncLogs] = useState<boolean>(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (connection: Connection, event: HTMLElement | null) => {
    setConnectionId(connection.connectionId);
    setResetDeploymentId(connection.resetConnDeploymentId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [showDialog, setShowDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [showConfirmResetDialog, setShowConfirmResetDialog] =
    useState<boolean>(false);
  const [rows, setRows] = useState<Array<any>>([]);
  const [rowValues, setRowValues] = useState<Array<Array<any>>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, mutate } = useSWR(`airbyte/v1/connections`);

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
            `${logObject.message} '\n'`
        );

        setSyncLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const pollForFlowRun = async (flow_run_id: string) => {
    let flowRunStatus: string = await fetchFlowRunStatus(flow_run_id);

    await fetchAndSetFlowRunLogs(flow_run_id);
    while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
      await delay(5000);
      await fetchAndSetFlowRunLogs(flow_run_id);
      flowRunStatus = await fetchFlowRunStatus(flow_run_id);
    }
  };

  const syncConnection = async (deploymentId: string, connectionId: string) => {
    setExpandSyncLogs(true);
    if (!deploymentId) {
      errorToast('Deployment not created', [], globalContext);
      return;
    }
    try {
      const response = await httpPost(
        session,
        `prefect/v1/flows/${deploymentId}/flow_run/`,
        {}
      );
      if (response?.detail) errorToast(response.detail, [], globalContext);

      // if flow run id is not present, something went wrong
      if (!response?.flow_run_id) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }

      successToast(`Sync initiated successfully`, [], globalContext);

      pollForFlowRun(response.flow_run_id);
      mutate();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setSyncingConnectionIds(
        syncingConnectionIds.filter((id) => id !== connectionId)
      );
    }
  };

  const deleteConnection = (connectionId: string) => {
    (async () => {
      try {
        setDeleteLoading(true);
        const message = await httpDelete(
          session,
          `airbyte/v1/connections/${connectionId}`
        );
        if (message.success) {
          successToast('Connection deleted', [], globalContext);
          mutate();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      } finally {
        setDeleteLoading(false);
      }
    })();
    handleCancelDeleteConnection();
  };

  const resetConnection = (deploymentId: string) => {
    (async () => {
      try {
        setResetLoading(true);
        const message = await httpPost(
          session,
          `prefect/v1/flows/${deploymentId}/flow_run/`,
          {}
        );
        if (message.success) {
          successToast(
            'Reset connection initiated successfully',
            [],
            globalContext
          );
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      } finally {
        setResetLoading(true);
      }
    })();
    handleCancelResetConnection();
  };

  const Actions = ({
    connection,
    idx,
  }: {
    connection: Connection;
    idx: string;
  }) => {
    const { deploymentId, connectionId, lock } = connection;
    return (
      <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'sync-' + idx}>
        <Button
          variant="contained"
          onClick={async () => {
            // push connection id into list of syncing connection ids
            if (!syncingConnectionIds.includes(connectionId)) {
              setSyncingConnectionIds([...syncingConnectionIds, connectionId]);
            }
            syncConnection(deploymentId, connectionId);
          }}
          data-testid={'sync-' + idx}
          disabled={
            syncingConnectionIds.includes(connectionId) ||
            !!lock ||
            !permissions.includes('can_sync_sources')
          }
          key={'sync-' + idx}
          sx={{ marginRight: '10px' }}
        >
          {syncingConnectionIds.includes(connectionId) || lock ? (
            <Image
              src={SyncIcon}
              className={styles.SyncIcon}
              alt="sync icon"
              data-testid="sync-icon"
            />
          ) : (
            'Sync'
          )}
        </Button>

        <Button
          id={idx}
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) => handleClick(connection, event.currentTarget)}
          variant="contained"
          key={'menu-' + idx}
          color="info"
          sx={{ p: 0, minWidth: 32 }}
          disabled={
            syncingConnectionIds.includes(connectionId) || lock ? true : false
          }
        >
          <MoreHorizIcon />
        </Button>
      </Box>
    );
  };

  const getLastSync = (connection: Connection) => {
    let jobStatus: string | null = null;
    let jobStatusColor = 'grey';

    // things when the connection is locked
    if (connection.lock?.status === 'running') {
      jobStatus = 'running';
    } else if (
      connection.lock?.status === 'locked' ||
      connection.lock?.status === 'complete'
    ) {
      jobStatus = 'locked';
    } else if (
      syncingConnectionIds.includes(connection.connectionId) ||
      connection.lock?.status === 'queued'
    ) {
      jobStatus = 'queued';
    }

    // if lock is not there; check for last run
    if (jobStatus === null && connection.lastRun) {
      if (connection.lastRun?.status === 'COMPLETED') {
        jobStatus = 'success';
        jobStatusColor = '#399D47';
      } else {
        jobStatus = 'failed';
        jobStatusColor = '#981F1F';
      }
    }

    const StatusIcon = ({
      sx,
      status,
    }: {
      sx: SxProps;
      status: string | null;
    }) => {
      if (status === null) return null;

      if (status === 'running') {
        return <LoopIcon sx={sx} />;
      } else if (status === 'locked') {
        return <LockIcon sx={sx} />;
      } else if (status === 'queued') {
        return <ScheduleIcon sx={sx} />;
      } else if (status === 'success') {
        return <TaskAltIcon sx={sx} />;
      } else if (status === 'failed') {
        return <WarningAmberIcon sx={sx} />;
      }

      return null;
    };

    return (
      <Box
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'left' }}
      >
        {jobStatus &&
          (['success', 'failed'].includes(jobStatus) ? (
            <Typography variant="subtitle2" fontWeight={600}>
              {lastRunTime(connection.lastRun?.startTime)}
            </Typography>
          ) : (
            <>
              {connection.lock && (
                <>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Triggered by: {trimEmail(connection.lock.lockedBy)}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {lastRunTime(connection.lock.lockedAt)}
                  </Typography>
                </>
              )}
            </>
          ))}
        <Box
          data-testid={`connectionstate-${jobStatus}`}
          sx={{
            display: 'flex',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <StatusIcon
            sx={{
              alignItems: 'center',
              fontWeight: 700,
              fontSize: 'large',
              color: jobStatusColor,
            }}
            status={jobStatus}
          />
          <Typography component="p" fontWeight={700} color={jobStatusColor}>
            {jobStatus}
          </Typography>
        </Box>
        {jobStatus && ['success', 'failed'].includes(jobStatus) && (
          <Button
            variant="contained"
            sx={{
              paddingY: '4px',
              paddingX: '2px',
              width: '60%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={() => {
              fetchAirbyteLogs(connection.connectionId);
              setExpandSyncLogs(true);
            }}
          >
            Fetch Logs
          </Button>
        )}
      </Box>
    );
  };

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
        <Actions
          key={`actions-${connection.blockId}`}
          connection={connection}
          idx={connection.blockId}
        />,
        // ),
      ]);

      const tempRowValues = data.map((connection: any) => [
        connection.name, // as we are only sorting by connection name...
        null,
        null,
      ]);

      setRows(tempRows);
      setRowValues(tempRowValues);
    }
  };

  const pollForConnectionsLockAndRefreshRows = async () => {
    try {
      let updatedData = await httpGet(session, 'airbyte/v1/connections');
      let isLocked: boolean = updatedData?.some((conn: any) => conn.lock);
      while (isLocked) {
        updatedData = await httpGet(session, 'airbyte/v1/connections');
        isLocked = updatedData?.some((conn: any) => (conn.lock ? true : false));
        await delay(3000);
        updateRows(updatedData);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // when the connection list changes
  useEffect(() => {
    if (session) {
      updateRows(data);
      pollForConnectionsLockAndRefreshRows();
    }
  }, [session, data]);

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

  const RefreshConnection = async () => {
    handleClose();
    setIsRefreshing(true); // Set loading state to true
    try {
      const response = await httpGet(
        session,
        `airbyte/v1/connections/${connectionId}/catalog`
      );
      if (response.success) {
        successToast('Connection refreshed successfully', [], globalContext);
        mutate(); // Update the connection data
      }
    } catch (err: any) {
      console.error(err);
      errorToast('Failed to refresh connection', [], globalContext);
    } finally {
      setIsRefreshing(false); // Set loading state to false
    }
  };

  // show load progress indicator
  if (isLoading || isRefreshing) {
    return <CircularProgress />;
  }

  return (
    <>
      <PendingActionsAccordion />
      <ActionsMenu
        eleType="connection"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEditConnection}
        handleRefresh={RefreshConnection}
        handleDelete={handleDeleteConnection}
        handleResetConnection={handleResetConnection}
        hasResetPermission={permissions.includes('can_reset_connection')}
        hasDeletePermission={permissions.includes('can_delete_connection')}
        hasEditPermission={permissions.includes('can_edit_connection')}
      />
      <CreateConnectionForm
        setConnectionId={setConnectionId}
        connectionId={connectionId}
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      <List
        hasCreatePermission={permissions.includes('can_create_connection')}
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
        rowValues={rowValues}
        height={115}
      />
      <ConfirmationDialog
        loading={deleteLoading}
        show={showConfirmDeleteDialog}
        handleClose={() => handleCancelDeleteConnection()}
        handleConfirm={() => deleteConnection(connectionId)}
        message="This will delete the connection permanently and all the flows built on top of this."
      />
      <ConfirmationDialog
        loading={resetLoading}
        show={showConfirmResetDialog}
        handleClose={() => handleCancelResetConnection()}
        handleConfirm={() => resetConnection(resetDeploymentId)}
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
