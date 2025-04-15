import { memo, useEffect, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress, Box, Typography, Tooltip, SxProps, TextField } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import SyncIcon from '@/assets/icons/sync.svg';
import LockIcon from '@mui/icons-material/Lock';
import LoopIcon from '@mui/icons-material/Loop';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CancelIcon from '@/assets/icons/cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useSession } from 'next-auth/react';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useContext } from 'react';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import connectionIcon from '@/assets/icons/connection.svg';
import CreateConnectionForm from './CreateConnectionForm';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import Image from 'next/image';
import styles from '@/styles/Common.module.css';
import { delay, lastRunTime, trimEmail } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import { LogCard } from '@/components/Logs/LogCard';
import { TaskLock } from '../Flows/Flows';
import { useConnSyncLogs, useConnSyncLogsUpdate } from '@/contexts/ConnectionSyncLogsContext';
import { ConnectionSyncHistory } from './ConnectionSyncHistory';
import PendingActionsAccordion from './PendingActions';
import { useSyncLock } from '@/customHooks/useSyncLock';
import { useTracking } from '@/contexts/TrackingContext';
import { formatDuration } from '@/utils/common';

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

export type QueuedRuntimeInfo = {
  max_wait_time: number;
  min_wait_time: number;
  queue_no: number;
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
  resetConnDeploymentId: string | null;
  clearConnDeploymentId: string | null;
  queuedFlowRunWaitTime: QueuedRuntimeInfo | null;
};
// type LockStatus = 'running' | 'queued' | 'locked' | null;
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

export const QueueTooltip = memo(({ queueInfo }: { queueInfo: QueuedRuntimeInfo | null }) => {
  if (
    !queueInfo ||
    queueInfo.queue_no <= 0 ||
    queueInfo.min_wait_time <= 0 ||
    queueInfo.max_wait_time <= 0
  ) {
    return <ScheduleIcon data-testid="schedule-icon" />;
  }

  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Queue Information
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Position in queue: <strong>{queueInfo.queue_no}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Estimated wait time: <strong>{formatDuration(queueInfo.min_wait_time)}</strong> -{' '}
            <strong>{formatDuration(queueInfo.max_wait_time)}</strong>
          </Typography>
        </Box>
      }
    >
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          '@keyframes pulse': {
            '0%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '50%': {
              transform: 'scale(1.1)',
              opacity: 0.8,
            },
            '100%': {
              transform: 'scale(1)',
              opacity: 1,
            },
          },
        }}
      >
        <ScheduleIcon
          sx={{
            animation: 'pulse 2s infinite',
            cursor: 'help',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            animation: 'pulse 2s infinite',
          }}
        />
      </Box>
    </Tooltip>
  );
});

QueueTooltip.displayName = 'QueueTooltip';

const StatusIcon = memo(
  ({ sx, status, queueInfo }: { sx: SxProps; status: string | null; queueInfo: any }) => {
    if (status === null) return null;

    if (status === 'running') {
      return <LoopIcon sx={sx} />;
    } else if (status === 'cancelled') {
      return <CancelIcon sx={sx} />;
    } else if (status === 'locked') {
      return <LockIcon sx={sx} />;
    } else if (status === 'queued') {
      return <QueueTooltip queueInfo={queueInfo} />;
    } else if (status === 'success') {
      return <TaskAltIcon sx={sx} />;
    } else if (status === 'failed') {
      return <WarningAmberIcon sx={sx} />;
    }

    return null;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.status === nextProps.status &&
      prevProps.queueInfo?.queue_no === nextProps.queueInfo?.queue_no &&
      prevProps.queueInfo?.min_wait_time === nextProps.queueInfo?.min_wait_time &&
      prevProps.queueInfo?.max_wait_time === nextProps.queueInfo?.max_wait_time
    );
  }
);

StatusIcon.displayName = 'StatusIcon';

const Actions = memo(
  ({
    connection,
    idx,
    syncConnection,
    permissions,
    syncingConnectionIds,
    setSyncingConnectionIds,
    open,
    handleClick,
  }: {
    connection: Connection;
    idx: string;
    syncConnection: any;
    permissions: string[];
    syncingConnectionIds: string[];
    setSyncingConnectionIds: any;
    open: boolean;
    handleClick: any;
  }) => {
    const { deploymentId, connectionId, lock } = connection;
    const globalContext = useContext(GlobalContext);
    const { data: session }: any = useSession();
    const { tempSyncState, setTempSyncState } = useSyncLock(lock);
    const trackAmplitudeEvent: any = useTracking();
    const isSyncConnectionIdPresent = syncingConnectionIds.includes(connectionId);
    const [loading, setLoading] = useState(false);

    const handlingSyncState = async () => {
      const res: any = await syncConnection(deploymentId, connectionId);
      if (res?.error == 'ERROR') {
        setTempSyncState(false);
      }
    };

    const handleCancelSync = async (flow_run_id: string) => {
      setLoading(true);
      try {
        const res: any = await httpPost(session, `prefect/flow_runs/${flow_run_id}/set_state`, {
          state: { name: 'Cancelling', type: 'CANCELLING' },
          force: true,
        });
        if (!res.success) {
          errorToast('Something Went wrong', [], globalContext);
          return;
        }
        successToast('Queued job cancelled successfully', [], globalContext);
      } catch (error: any) {
        errorToast(error.message, [], globalContext);
      } finally {
        await delay(6000);
        setLoading(false);
      }
    };

    return (
      <Box sx={{ justifyContent: 'end', display: 'flex' }} key={'sync-' + idx}>
        {lock?.status === 'queued' && lock?.flowRunId && (
          <Button
            variant="contained"
            onClick={() => {
              handleCancelSync(lock.flowRunId as string);
            }}
            disabled={loading}
            sx={{ marginRight: '10px' }}
            key={'cancel-queued-sync-' + idx}
            data-testid={`cancel-queued-sync-${connection.connectionId}`}
          >
            Cancel
          </Button>
        )}

        <Button
          variant="contained"
          onClick={async () => {
            handlingSyncState();
            setTempSyncState(true);
            trackAmplitudeEvent(`[Sync-connection] Button Clicked`);
            // push connection id into list of syncing connection ids
            if (!isSyncConnectionIdPresent) {
              setSyncingConnectionIds([...syncingConnectionIds, connectionId]);
            }
          }}
          data-testid={'sync-' + idx}
          disabled={tempSyncState || !!lock || !permissions.includes('can_sync_sources')}
          key={'sync-' + idx}
          sx={{ marginRight: '10px' }}
        >
          {tempSyncState || lock ? (
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
          disabled={tempSyncState || lock ? true : false}
        >
          <MoreHorizIcon />
        </Button>
      </Box>
    );
  },
  //rerenderes when fn returns false.
  // checking lock when doing sync and checking connectionId wehen we sort the list or a new connection gets added.
  (prevProps, nextProps) => {
    return (
      prevProps.connection.lock?.status === nextProps.connection.lock?.status &&
      prevProps.connection.connectionId === nextProps.connection.connectionId
    );
  }
);
Actions.displayName = 'Action'; //display name added.

const SyncStatus = memo(
  ({
    connection,
    syncingConnectionIds,
    setShowLogsDialog,
    setLogsConnection,
    trackAmplitudeEvent,
  }: {
    connection: Connection;
    syncingConnectionIds: string[];
    setShowLogsDialog: (show: boolean) => void;
    setLogsConnection: (connection: Connection) => void;
    trackAmplitudeEvent: (event: string) => void;
  }) => {
    let jobStatus: string | null = null;
    let jobStatusColor = 'grey';

    // things when the connection is locked
    if (connection.lock?.status === 'running') {
      jobStatus = 'running';
    } else if (connection.lock?.status === 'cancelled') {
      jobStatus = 'cancelled';
    } else if (connection.lock?.status === 'locked' || connection.lock?.status === 'complete') {
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
      } else if (connection.lastRun.status === 'CANCELLED') {
        jobStatus = 'cancelled';
        jobStatusColor = '#DAA520';
      } else {
        jobStatus = 'failed';
        jobStatusColor = '#981F1F';
      }
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {jobStatus &&
          (['success', 'failed', 'cancelled'].includes(jobStatus) ? (
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
            queueInfo={connection.queuedFlowRunWaitTime}
          />
          <Typography component="p" fontWeight={700} color={jobStatusColor}>
            {jobStatus}
          </Typography>
        </Box>
        {jobStatus && (
          <Button
            variant="contained"
            sx={{
              paddingY: '4px',
              paddingX: '2px',
              width: '80%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onClick={() => {
              setShowLogsDialog(true);
              setLogsConnection(connection);
              trackAmplitudeEvent('[View history] Button clicked');
            }}
          >
            View history
          </Button>
        )}
      </Box>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.connection.lock?.status === nextProps.connection.lock?.status &&
      prevProps.connection.lastRun?.status === nextProps.connection.lastRun?.status &&
      prevProps.connection.queuedFlowRunWaitTime?.queue_no ===
        nextProps.connection.queuedFlowRunWaitTime?.queue_no &&
      prevProps.connection.queuedFlowRunWaitTime?.min_wait_time ===
        nextProps.connection.queuedFlowRunWaitTime?.min_wait_time &&
      prevProps.connection.queuedFlowRunWaitTime?.max_wait_time ===
        nextProps.connection.queuedFlowRunWaitTime?.max_wait_time &&
      prevProps.syncingConnectionIds.includes(prevProps.connection.connectionId) ===
        nextProps.syncingConnectionIds.includes(nextProps.connection.connectionId)
    );
  }
);

SyncStatus.displayName = 'SyncStatus';

export const Connections = () => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];
  const [connectionId, setConnectionId] = useState<string>('');
  const [logsConnection, setLogsConnection] = useState<Connection>();
  // const [resetDeploymentId, setResetDeploymentId] = useState<string>('');
  const [clearConnDeploymentId, setClearConnDeploymentId] = useState<string | null>('');
  const [syncingConnectionIds, setSyncingConnectionIds] = useState<Array<string>>([]);
  const syncLogs = useConnSyncLogs();
  const setSyncLogs = useConnSyncLogsUpdate();
  const [expandSyncLogs, setExpandSyncLogs] = useState<boolean>(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [resetLoading, setResetLoading] = useState<boolean>(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (connection: Connection, event: HTMLElement | null) => {
    setConnectionId(connection.connectionId);
    // setResetDeploymentId(connection.resetConnDeploymentId);
    console.log(connection);
    console.log(connection.clearConnDeploymentId);
    setClearConnDeploymentId(connection.clearConnDeploymentId);
    setAnchorEl(event);
  };
  const handleClose = (isEditMode?: string) => {
    if (isEditMode !== 'EDIT') {
      setConnectionId('');
      setClearConnDeploymentId('');
    }
    setAnchorEl(null);
  };
  const [showDialog, setShowDialog] = useState(false);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState<boolean>(false);
  const [showConfirmResetDialog, setShowConfirmResetDialog] = useState<boolean>(false);
  const [rows, setRows] = useState<Array<any>>([]);
  const [rowValues, setRowValues] = useState<Array<Array<any>>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, mutate } = useSWR(`airbyte/v1/connections`);

  const trackAmplitudeEvent = useTracking();
  const fetchFlowRunStatus = async (flow_run_id: string) => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(session, `prefect/flow_runs/${flow_run_id}`);

      if (!flowRun.state_type) return 'FAILED';

      return flowRun.state_type;
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flow_run_id: string) => {
    try {
      const response = await httpGet(session, `prefect/flow_runs/${flow_run_id}/logs`);
      if (response?.logs?.logs && response.logs.logs.length > 0) {
        const logsArray = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) => `${logObject.message} '\n'`
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
    console.log(flowRunStatus, 'flowrunstates');
    while (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(flowRunStatus)) {
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
      const response = await httpPost(session, `prefect/v1/flows/${deploymentId}/flow_run/`, {});
      // returning {error:"ERROR"} to stop loader if error occurs.
      if (response?.detail) {
        errorToast(response.detail, [], globalContext);
        return { error: 'ERROR' };
      }

      // if flow run id is not present, something went wrong
      if (!response?.flow_run_id) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }

      successToast(`Sync initiated successfully`, [], globalContext);

      pollForFlowRun(response.flow_run_id);
      mutate();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
      return { error: 'ERROR' };
    } finally {
      setSyncingConnectionIds(syncingConnectionIds.filter((id) => id !== connectionId));
    }
  };

  const deleteConnection = (connectionId: string) => {
    (async () => {
      try {
        setDeleteLoading(true);
        const message = await httpDelete(session, `airbyte/v1/connections/${connectionId}`);
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

  const clearConnection = (deploymentId: string | null) => {
    console.log('here inside', deploymentId);
    (async () => {
      try {
        if (!deploymentId) {
          errorToast('Deployment not created', [], globalContext);
          return;
        }

        setResetLoading(true);
        const message = await httpPost(session, `prefect/v1/flows/${deploymentId}/flow_run/`, {});
        if (message.success) {
          successToast('Clear connection initiated successfully', [], globalContext);
          mutate();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      } finally {
        setResetLoading(true);
      }
    })();
    handleCancelClearConnection();
  };

  const updateRows = (data: any) => {
    if (data && data.length > 0) {
      const tempRows = data.map((connection: any) => [
        <Box key={`name-${connection.blockId}`} sx={{ display: 'flex', alignItems: 'center' }}>
          <Image style={{ marginRight: 10 }} src={connectionIcon} alt="dbt icon" />
          <Typography variant="body1" fontWeight={600}>
            {connection.name}
          </Typography>
        </Box>,
        getSourceDest(connection),
        <SyncStatus
          key={`sync-status-${connection.blockId}`}
          connection={connection}
          syncingConnectionIds={syncingConnectionIds}
          setShowLogsDialog={setShowLogsDialog}
          setLogsConnection={setLogsConnection}
          trackAmplitudeEvent={trackAmplitudeEvent}
        />,
        <Actions
          key={`actions-${connection.blockId}`}
          connection={connection}
          idx={connection.blockId}
          permissions={permissions}
          syncConnection={syncConnection}
          syncingConnectionIds={syncingConnectionIds}
          setSyncingConnectionIds={setSyncingConnectionIds}
          open={open}
          handleClick={handleClick}
        />,
      ]);

      const tempRowValues = data.map((connection: any) => [connection.name, null, null]);

      setRows(tempRows);
      setRowValues(tempRowValues);
    } else {
      setRows([]);
      setRowValues([]);
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

  const onSearchValueChange = (value: string) => {
    if (!data) return;

    const lower = value.toLowerCase().trim();
    if (lower === '') {
      updateRows(data);
    } else {
      const filtered = data.filter((conn: any) => {
        return (
          conn.name?.toLowerCase().includes(lower) ||
          conn.source?.sourceName?.toLowerCase().includes(lower) ||
          conn.destination?.destinationName?.toLowerCase().includes(lower)
        );
      });
      updateRows(filtered);
    }
  };

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleDeleteConnection = () => {
    handleClose('EDIT');
    setShowConfirmDeleteDialog(true);
  };

  const handleCancelDeleteConnection = () => {
    setShowConfirmDeleteDialog(false);
  };

  const handleCancelClearConnection = () => {
    setShowConfirmResetDialog(false);
  };

  const handleClearConnection = () => {
    handleClose('EDIT');
    setShowConfirmResetDialog(true);
    trackAmplitudeEvent('[Reset-connection] Button Clicked');
  };

  const handleEditConnection = () => {
    handleClose('EDIT');
    setShowDialog(true);
  };

  const RefreshConnection = async () => {
    handleClose();
    setIsRefreshing(true); // Set loading state to true
    try {
      const response = await httpGet(session, `airbyte/v1/connections/${connectionId}/catalog`);
      const checkRefresh = async function () {
        const refreshResponse = await httpGet(session, 'tasks/stp/' + response.task_id);
        if (refreshResponse.progress && refreshResponse.progress.length > 0) {
          const lastStatus = refreshResponse.progress[refreshResponse.progress.length - 1].status;
          // running | failed | completed
          if (lastStatus === 'failed') {
            errorToast('Failed to refresh connection', [], globalContext);
            return;
          } else if (lastStatus === 'completed') {
            successToast('Connection refreshed successfully', [], globalContext);
            mutate();
            return;
          }
        }
        // else poll again
        await delay(2000);
        await checkRefresh();
      };
      await checkRefresh();
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
      {showLogsDialog && (
        <ConnectionSyncHistory setShowLogsDialog={setShowLogsDialog} connection={logsConnection} />
      )}
      <PendingActionsAccordion refreshConnectionsList={mutate} />
      <ActionsMenu
        eleType="connection"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEditConnection}
        handleRefresh={RefreshConnection}
        handleDelete={handleDeleteConnection}
        handleClearConnection={handleClearConnection}
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
      <Box>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <TextField
            label="Search Connections"
            variant="outlined"
            size="small"
            onChange={(e) => onSearchValueChange(e.target.value)}
            sx={{ width: 300 }}
          />
          <Button
            data-testid="add-new-connection"
            variant="contained"
            onClick={handleClickOpen}
            disabled={!permissions.includes('can_create_connection')}
            className="connectionadd_walkthrough"
          >
            + New Connection
          </Button>
        </Box>
        <List
          onlyList
          hasCreatePermission={permissions.includes('can_create_connection')}
          openDialog={handleClickOpen}
          title="Connection"
          headers={headers}
          rows={rows}
          rowValues={rowValues}
          height={115}
        />
      </Box>
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
        handleClose={() => handleCancelClearConnection()}
        handleConfirm={() => clearConnection(clearConnDeploymentId)}
        message="Clearing the connection will remove all data at the warehouse in the connection's destination table."
      />
      <LogCard logs={syncLogs} expand={expandSyncLogs} setExpand={setExpandSyncLogs} />
    </>
  );
};
