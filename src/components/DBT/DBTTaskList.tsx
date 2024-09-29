import { Box, Button, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import SyncIcon from '@/assets/icons/sync.svg';
import LoopIcon from '@mui/icons-material/Loop';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import styles from '@/styles/Common.module.css';
import { useSession } from 'next-auth/react';
import { TransformTask } from './DBTTarget';
import { List } from '../List/List';
import { delay, lastRunTime, trimEmail } from '@/utils/common';
import Image from 'next/image';
import {
  TASK_DBTRUN,
  TASK_DBTTEST,
  TASK_DOCSGENERATE,
} from '@/config/constant';
import { ActionsMenu } from '../UI/Menu/Menu';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';
import CreateOrgTaskForm from './CreateOrgTaskForm';
import LockIcon from '@mui/icons-material/Lock';
import { useTracking } from '@/contexts/TrackingContext';

type params = {
  setFlowRunId: (...args: any) => any;
  fetchLogs: (...args: any) => any;
  setDbtRunLogs: (...args: any) => any;
  setExpandLogs: (...args: any) => any;
  tasks: TransformTask[];
  isAnyTaskLocked: boolean;
  fetchDbtTasks: (...args: any) => any;
};

type ActionsParam = {
  task: TransformTask;
};

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

export const DBTTaskList = ({
  tasks,
  setFlowRunId,
  fetchLogs,
  setDbtRunLogs,
  setExpandLogs,
  isAnyTaskLocked,
  fetchDbtTasks,
}: params) => {
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const permissions = toastContext?.Permissions.state || [];
  const [rows, setRows] = useState<Array<any>>([]);
  const [taskId, setTaskId] = useState<string>('');
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [runningTask, setRunningTask] = useState<TransformTask | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [showCreateOrgTaskDialog, setShowCreateOrgTaskDialog] =
    useState<boolean>(false);
  const [deleteTaskLoad, setDeleteTaskLoading] = useState(false);
  const trackAmplitudeEvent = useTracking();
  const handleClick = (taskId: string, event: HTMLElement | null) => {
    setTaskId(taskId);
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const Actions = ({ task }: ActionsParam) => (
    <Box
      sx={{ justifyContent: 'end', display: 'flex' }}
      key={'task-' + task.uuid}
    >
      <Button
        variant="contained"
        onClick={() => {
          setRunningTask(task);
          trackAmplitudeEvent(`[${task.label}] Button Clicked`);
        }}
        data-testid={'task-' + task.uuid}
        disabled={
          !!runningTask ||
          isAnyTaskLocked ||
          !permissions.includes('can_run_orgtask')
        }
        key={'task-' + task.uuid}
        sx={{ marginRight: '10px', width: '75px', height: '40px' }}
      >
        {runningTask?.uuid === task.uuid ||
        (task.lock?.status && task.lock?.status !== 'complete') ? (
          <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
        ) : (
          'Execute'
        )}
      </Button>
      {task.generated_by === 'client' ? (
        <Button
          id={task.slug}
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(event) =>
            handleClick(String(task.uuid), event.currentTarget)
          }
          variant="contained"
          key={'menu-' + task.uuid}
          color="info"
          sx={{
            p: 0,
            minWidth: 32,
            ...((runningTask || isAnyTaskLocked) && { visibility: 'hidden' }),
          }}
        >
          <MoreHorizIcon />
        </Button>
      ) : (
        <SettingsIcon
          sx={{
            minWidth: '32px',
            color: 'text.secondary',
            marginTop: '5px',
          }}
        ></SettingsIcon>
      )}
    </Box>
  );

  useEffect(() => {
    if (runningTask) {
      if (runningTask.slug === TASK_DBTRUN || runningTask.deploymentId)
        dbtRunWithDeployment(runningTask);
      else executeDbtJob(runningTask);
    }
  }, [runningTask]);

  const executeDbtJob = async function (task: TransformTask) {
    setExpandLogs(true);
    setDbtRunLogs([]);

    try {
      let message = null;
      message = await httpPost(session, `prefect/tasks/${task.uuid}/run/`, {});
      if (message?.status === 'success') {
        successToast('Job ran successfully', [], toastContext);
      } else {
        errorToast('Job failed', [], toastContext);
      }

      // For dbt test command, we wont get the logs in message?.result if the operation fails
      if (task.slug === TASK_DBTTEST) {
        // Custom state has been returned
        // need another api call to fetch the logs
        if (message?.result[0]?.id) {
          await fetchAndSetFlowRunLogs(
            message.result[0]?.state_details?.flow_run_id
          );
        } else {
          setDbtRunLogs(message?.result);
        }
      } else {
        setDbtRunLogs(message?.result);
      }
      setRunningTask(null);
    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    } finally {
      setRunningTask(null);
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
            `- ${logObject.message} '\n'`
        );

        setDbtRunLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const dbtRunWithDeployment = async (task: any) => {
    if (task.deploymentId) {
      setExpandLogs(true);
      setDbtRunLogs([]);
      try {
        const response = await httpPost(
          session,
          `prefect/v1/flows/${task.deploymentId}/flow_run/`,
          {}
        );

        // if flow run id is not present, something went wrong
        if (!response.flow_run_id)
          errorToast('Something went wrong', [], toastContext);

        // Poll and show logs till flow run is either completed or failed
        let flowRunStatus: string = await fetchFlowRunStatus(
          response.flow_run_id
        );
        setFlowRunId(response.flow_run_id);
        fetchDbtTasks();
        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await delay(5000);
          await fetchLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
        }
        setRunningTask(null);
        fetchDbtTasks();
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setRunningTask(null);
      }
    } else {
      setRunningTask(null);
      errorToast('No deployment found for this DBT task', [], toastContext);
    }
  };

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const tempRows = tasks
        .filter((task: TransformTask) => task.slug != TASK_DOCSGENERATE)
        .map((task: TransformTask) => [
          <Box
            key={`name-${task.uuid}`}
            sx={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}
          >
            <Typography variant="body2" fontWeight={400}>
              {task.command}
            </Typography>
          </Box>,
          <Box
            key={`actions-${task.uuid}`}
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
          >
            {task.lock && isAnyTaskLocked ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ alignItems: 'center', display: 'flex' }}>
                  {task.lock?.status === 'running' ? (
                    <LoopIcon />
                  ) : task.lock?.status === 'locked' ||
                    task.lock?.status === 'complete' ? (
                    <LockIcon />
                  ) : (
                    <ScheduleIcon />
                  )}
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Triggered by: {trimEmail(task.lock.lockedBy)}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {lastRunTime(task.lock.lockedAt)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              ''
            )}
            <Actions key={`actions-${task.uuid}`} task={task} />
          </Box>,
        ]);

      setRows(tempRows);
    }
  }, [tasks, runningTask, isAnyTaskLocked]);

  const deleteTask = (taskId: string) => {
    (async () => {
      try {
        setDeleteTaskLoading(true);
        const message = await httpDelete(session, `prefect/tasks/${taskId}/`);
        if (message.success) {
          successToast('Task deleted', [], toastContext);
          fetchDbtTasks();
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setDeleteTaskLoading(false);
      }
    })();
    handleCancelDeleteTask();
  };

  const handleCancelDeleteTask = () => {
    setShowConfirmDeleteDialog(false);
  };

  const openDeleteTaskModal = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleCreateOpenOrgTaskDialog = () => {
    setShowCreateOrgTaskDialog(true);
    trackAmplitudeEvent('[+ New Task] Button Clicked');
  };

  return (
    <>
      <ActionsMenu
        eleType="transformtask"
        anchorEl={anchorEl}
        open={open}
        hasDeletePermission={permissions.includes('can_delete_orgtask')}
        handleClose={handleClose}
        handleDelete={openDeleteTaskModal}
      />
      <List
        hasCreatePermission={permissions.includes('can_create_orgtask')}
        openDialog={handleCreateOpenOrgTaskDialog}
        title="Task"
        headers={{ values: ['Command'] }}
        rows={rows}
        height={80}
      />
      <ConfirmationDialog
        loading={deleteTaskLoad}
        show={showConfirmDeleteDialog}
        handleClose={() => setShowConfirmDeleteDialog(false)}
        handleConfirm={() => deleteTask(taskId)}
        message="This will delete the task permanently."
      />
      <CreateOrgTaskForm
        mutate={fetchDbtTasks}
        showForm={showCreateOrgTaskDialog}
        setShowForm={setShowCreateOrgTaskDialog}
      />
    </>
  );
};
