import { Button, MenuItem, Select } from '@mui/material';

import React, { useContext, useState } from 'react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import SyncIcon from '@/assets/icons/sync.svg';
import Image from 'next/image';
import styles from './../Connections/Connections.module.css';
import { delay } from '@/utils/common';
import { TASK_DBTRUN, TASK_DBTTEST } from '@/config/constant';
import { TaskLock } from '../Flows/Flows';

export type TransformTask = {
  label: string;
  slug: string;
  deploymentId: string | null;
  lock: TaskLock | null;
  command: string | null;
  generated_by: string;
  uuid: string;
  seq: number;
  pipeline_default: boolean;
};

type params = {
  tasks: TransformTask[];
  setRunning: any;
  running: boolean;
  setDbtRunLogs: any;
  setExpandLogs: any;
};

export type PrefectFlowRunLog = {
  level: number;
  timestamp: string;
  message: string;
};

export type PrefectFlowRun = {
  id: string;
  name: string;
  deployment_id: string;
  flow_id: string;
  state_type: string;
  state_name: string;
};

export const DBTTarget = ({
  tasks,
  setDbtRunLogs,
  setRunning,
  running,
  setExpandLogs,
}: params) => {
  const [selectedTask, setSelectedTask] = useState<TransformTask | undefined>();
  const toastContext = useContext(GlobalContext);
  const { data: session }: any = useSession();

  const executeDbtJob = async function (task: TransformTask) {
    setRunning(true);
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
    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
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
      setRunning(true);
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

        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await delay(5000);
          await fetchAndSetFlowRunLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setRunning(false);
      }
      setRunning(false);
    } else {
      errorToast('No deployment found for this DBT task', [], toastContext);
    }
  };

  return (
    <>
      <Select
        label="Dbt functions"
        data-testid="dbt-functions"
        value={selectedTask?.slug || 'Select function'}
        sx={{ width: '150px', textAlign: 'center' }}
        onChange={(event) => {
          const task = tasks.find(
            (task: TransformTask) => task.slug === event.target.value
          );
          setSelectedTask(task);
        }}
      >
        <MenuItem value="Select function" disabled>
          Select function
        </MenuItem>
        {tasks.map((task) => (
          <MenuItem key={task.uuid} value={task.slug}>
            {task.label}
          </MenuItem>
        ))}
      </Select>
      <Button
        data-testid="runJob"
        key={selectedTask?.slug}
        variant="contained"
        sx={{ ml: 2 }}
        onClick={() => {
          if (selectedTask) {
            if (selectedTask.slug == TASK_DBTRUN || selectedTask.deploymentId)
              dbtRunWithDeployment(selectedTask);
            else executeDbtJob(selectedTask);
          } else {
            errorToast(
              'Please select a dbt function to execute',
              [],
              toastContext
            );
          }
        }}
        disabled={running}
      >
        {running ? (
          <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
        ) : (
          'Execute'
        )}
      </Button>
    </>
  );
};
