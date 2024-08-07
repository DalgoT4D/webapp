import { Box, Button, Typography, SxProps } from '@mui/material';
import React, { memo, useContext, useMemo, useState } from 'react';
import FlowIcon from '@/assets/icons/flow.svg';
import LoopIcon from '@mui/icons-material/Loop';
import LockIcon from '@mui/icons-material/Lock';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SyncIcon from '@/assets/icons/sync.svg';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete, httpPost } from '@/helpers/http';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { List } from '../List/List';
import { lastRunTime, cronToString, trimEmail } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import Image from 'next/image';
import { FlowRun } from './SingleFlowRunHistory';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import styles from './Flows.module.css';
import { localTimezone } from '@/utils/common';
import { FlowLogs } from './FlowLogs';
import { useSyncLock } from '@/customHooks/useSyncLock';

export interface TaskLock {
  lockedBy: string;
  lockedAt: string;
  status: 'queued' | 'running' | 'locked' | 'complete';
  flowRunId?: string;
  celeryTaskId?: string;
}

export interface FlowInterface {
  name: string;
  cron: string;
  deploymentName: string;
  deploymentId: string;
  lastRun: FlowRun | null;
  lock: TaskLock | undefined | null;
  status: boolean;
}

export interface FlowsInterface {
  flows: Array<FlowInterface>;
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
  setSelectedFlowId: (arg: string) => any;
}

const flowStatus = (status: boolean) => (
  <Typography component="p" fontWeight={600} width={100}>
    {status ? 'Active' : 'Inactive'}
  </Typography>
);

const flowLastRun = (flow: FlowInterface) => {
  return (
    <>
      {flow.lock ? (
        <Box width={120}>
          <Typography variant="subtitle2" fontWeight={600}>
            By: <strong>{trimEmail(flow.lock.lockedBy)}</strong>
          </Typography>
          <Typography variant="subtitle2" fontWeight={600} fontSize={10}>
            {lastRunTime(flow.lock.lockedAt)}
          </Typography>
        </Box>
      ) : flow.lastRun ? (
        <Typography
          data-testid={'flowlastrun-' + flow.name}
          fontWeight={600}
          component="p"
        >
          {lastRunTime(
            flow.lastRun?.startTime || flow.lastRun?.expectedStartTime
          )}
        </Typography>
      ) : (
        <Box
          data-testid={'flowlastrun-' + flow.name}
          sx={{
            display: 'flex',
            color: '#399D47',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          &mdash;
        </Box>
      )}
    </>
  );
};
const Actions = memo(({ flow,
  idx,
  setShowLogsDialog,
  setFlowLogs,
  permissions,
  runningDeploymentIds,
  setRunningDeploymentIds,
  handleQuickRunDeployment,
  open,
  handleClick }: {
    flow: FlowInterface;
    idx: string,
    setShowLogsDialog: Function,
    setFlowLogs: Function,
    permissions: any,
    runningDeploymentIds: string[],
    setRunningDeploymentIds: Function,
    handleQuickRunDeployment: Function,
    open: boolean,
    handleClick: any
  }) => {
  const { lock } = flow;
  const { tempSyncState, setTempSyncState } = useSyncLock(lock);
  const handlingSyncState = async () => {
    const res: any = await handleQuickRunDeployment(flow.deploymentId);
    if (res?.error == "ERROR") {
      setTempSyncState(false);
    }
  }
  return (
    <Box key={idx} sx={{ width: '200px' }}>
      <Button
        variant="contained"
        color="info"
        data-testid={'btn-openhistory-' + flow.name}
        sx={{
          fontWeight: 600,
          marginRight: '5px',
        }}
        disabled={tempSyncState || !!lock || !permissions.includes('can_view_pipeline')}
        onClick={() => {
          setShowLogsDialog(true);
          setFlowLogs(flow);
        }}
      >
        last logs
      </Button>
      <>
        <Button
          sx={{ mr: 1 }}
          data-testid={'btn-quickrundeployment-' + flow.name}
          variant="contained"
          disabled={
            tempSyncState ||
            !!lock ||
            !permissions.includes('can_run_pipeline')
          }
          onClick={async () => {
            setTempSyncState(true);
            handlingSyncState();
            // push deployment id into list of running deployment ids
            if (!runningDeploymentIds.includes(flow.deploymentId)) {
              setRunningDeploymentIds([
                ...runningDeploymentIds,
                flow.deploymentId,
              ]);
            }
          }}
        >
          {tempSyncState || lock ? (
            <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
          ) : (
            'Run'
          )}
        </Button>
        <Button
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) =>
            handleClick(flow.deploymentId, event.currentTarget)
          }
          variant="contained"
          key={'menu-' + idx}
          color="info"
          sx={{ px: 0, minWidth: 32 }}
          disabled={
            tempSyncState || lock
              ? true
              : false
          }
        >
          <MoreHorizIcon />
        </Button>
      </>
    </Box>
  )
});


export const Flows = ({
  flows,
  updateCrudVal,
  mutate,
  setSelectedFlowId,
}: FlowsInterface) => {
  const [runningDeploymentIds, setRunningDeploymentIds] = useState<string[]>(
    []
  );
  const [deploymentId, setDeploymentId] = useState<string>('');
  const { data: session }: any = useSession();
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [flowLogs, setFlowLogs] = useState<FlowInterface>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [deleteFlowLoading, setDeleteFlowLoading] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteConnection = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleEditConnection = () => {
    handleClose();
    setSelectedFlowId(deploymentId);
    updateCrudVal('update');
  };

  const handleClick = (blockId: string, event: HTMLElement | null) => {
    setDeploymentId(blockId);
    setAnchorEl(event);
  };

  const flowState = (flow: FlowInterface) => {
    let jobStatus: string | null = null;
    let jobStatusColor = 'grey';

    // things when the connection is locked
    if (flow.lock?.status === 'running') {
      jobStatus = 'running';
    } else if (
      flow.lock?.status === 'locked' ||
      flow.lock?.status === 'complete'
    ) {
      jobStatus = 'locked';
    } else if (
      runningDeploymentIds.includes(flow.deploymentId) ||
      flow.lock?.status === 'queued'
    ) {
      jobStatus = 'queued';
    }

    if (jobStatus === null && flow.lastRun) {
      const state_name = flow.lastRun?.state_name;
      const status =
        state_name === 'DBT_TEST_FAILED'
          ? 'dbt tests failed'
          : flow.lastRun?.status;
      if (status === 'dbt tests failed') {
        jobStatus = 'dbt test failed';
        jobStatusColor = '#df8e14';
      } else if (status === 'COMPLETED') {
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
        data-testid={'flowstate-' + flow.name}
        sx={{
          width: 100,
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
        {jobStatus ? (
          <Typography component="p" fontWeight={700} color={jobStatusColor}>
            {jobStatus}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              color: '#399D47',
              gap: '3px',
              alignItems: 'center',
            }}
          >
            &mdash;
          </Box>
        )}
      </Box>
    );
  };


  const handleQuickRunDeployment = async (deploymentId: string) => {
    try {
      await httpPost(session, `prefect/v1/flows/${deploymentId}/flow_run/`, {});
      successToast('Flow run inititated successfully', [], globalContext);
      mutate();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
      return { error: "ERROR" };
    } finally {
      setRunningDeploymentIds(
        runningDeploymentIds.filter((id) => id !== deploymentId)
      );
    }
  };

  // when the connection list changes
  let rows = [];

  rows = useMemo(() => {
    if (flows && flows.length >= 0) {
      return flows.map((flow: FlowInterface, idx: number) => [
        <Box
          key={`name-${flow.deploymentId}`}
          sx={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}
        >
          <Image style={{ marginRight: 10 }} src={FlowIcon} alt="flow icon" />
          <Typography variant="h6" fontWeight={700} width={200}>
            {`${flow.name}`}
          </Typography>
        </Box>,
        <Box
          key={`schedule-${flow.deploymentId}`}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: 90,
          }}
        >
          <Typography
            variant="subtitle2"
            color="rgba(9, 37, 64, 0.87)"
            fontWeight={700}
            sx={{ paddingLeft: 1 }}
          >
            {flow.cron ? cronToString(flow.cron) : 'Manual'}
          </Typography>
          {flow.cron && (
            <Typography
              variant="subtitle2"
              color="rgba(9, 37, 64, 0.87)"
              fontWeight={700}
              sx={{ paddingLeft: 1 }}
            >
              {localTimezone()}
            </Typography>
          )}
        </Box>,
        flowStatus(flow.status),

        flowLastRun(flow),
        flowState(flow),
        <Actions
          key={`actions-${flow.deploymentId}`}
          flow={flow}
          idx={idx.toString()}
          setShowLogsDialog={setShowLogsDialog}
          setFlowLogs={setFlowLogs}
          permissions={permissions}
          runningDeploymentIds={runningDeploymentIds}
          setRunningDeploymentIds={setRunningDeploymentIds}
          handleQuickRunDeployment={handleQuickRunDeployment}
          open={open}
          handleClick={handleClick}
        />,
      ]);
    }
    return [];
  }, [flows]);

  const handleClickCreateFlow = () => {
    updateCrudVal('create');
  };


  const handleDeleteFlow = () => {
    (async () => {
      setDeleteFlowLoading(true);
      try {
        const data = await httpDelete(
          session,
          `prefect/v1/flows/${deploymentId}`
        );
        if (data?.success) {
          successToast('Flow deleted successfully', [], globalContext);
        } else {
          errorToast('Something went wrong', [], globalContext);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      } finally {
        mutate();
        handleClose();
        setShowConfirmDeleteDialog(false);
        setDeleteFlowLoading(false);
      }
    })();
  };

  return (
    <>
      <ActionsMenu
        eleType="flow"
        anchorEl={anchorEl}
        open={open}
        hasEditPermission={permissions.includes('can_edit_pipeline')}
        hasDeletePermission={permissions.includes('can_delete_pipeline')}
        handleEdit={handleEditConnection}
        handleClose={handleClose}
        handleDelete={handleDeleteConnection}
      />
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between' }}
        className="pipelinelist_walkthrough"
      >
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Pipelines
        </Typography>
      </Box>

      <List
        hasCreatePermission={permissions.includes('can_create_pipeline')}
        rows={rows}
        openDialog={handleClickCreateFlow}
        headers={{
          values: [
            '',
            'Schedule',
            'Pipeline Status',
            'Last run',
            'Last run status',
          ],
        }}
        title={'Pipeline'}
      />

      {showLogsDialog && (
        <FlowLogs setShowLogsDialog={setShowLogsDialog} flow={flowLogs} />
      )}

      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => setShowConfirmDeleteDialog(false)}
        handleConfirm={() => handleDeleteFlow()}
        message="This will permanently delete the pipeline, which will also delete the sequence and remove it completely from the listing."
        loading={deleteFlowLoading}
      />
    </>
  );
};
