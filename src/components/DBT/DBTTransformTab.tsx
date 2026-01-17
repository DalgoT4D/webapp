import React, { useContext, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';
import DBTRepositoryCard from './DBTRepositoryCard';
import { DBTTaskList } from './DBTTaskList';
import { TransformTask } from './DBTTarget';
import { LogCard } from '@/components/Logs/LogCard';
import { delay } from '@/utils/common';
import { flowRunLogsOffsetLimit } from '@/config/constant';

interface DBTTransformTabProps {
  gitConnected: boolean;
  onConnectGit: () => void;
}

const DBTTransformTab: React.FC<DBTTransformTabProps> = ({ gitConnected, onConnectGit }) => {
  const [tasks, setTasks] = useState<TransformTask[]>([]);
  const [flowRunId, setFlowRunId] = useState('');
  const [maxLogs, setMaxLogs] = useState<number>(flowRunLogsOffsetLimit);
  const dbtSetupLogsRef = useRef<string[]>([]);
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [dbtSetupLogs, setDbtSetupLogs] = useState<string[]>([]);
  const [anyTaskLocked, setAnyTaskLocked] = useState<boolean>(false);

  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);

  useEffect(() => {
    if (session) {
      fetchDBTTasks();
    }
  }, [session]);

  useEffect(() => {
    dbtSetupLogsRef.current = dbtSetupLogs;
  }, [dbtSetupLogs]);

  const pollDbtTasksLock = async () => {
    try {
      let isLocked = true;
      while (isLocked) {
        const response = await httpGet(session, 'prefect/tasks/transform/');
        isLocked = response?.some((task: TransformTask) => (task.lock ? true : false));
        await delay(3000);
      }
      setAnyTaskLocked(false);
    } catch (error) {
      setAnyTaskLocked(false);
    }
  };

  const fetchDBTTasks = async () => {
    try {
      const response = await httpGet(session, 'prefect/tasks/transform/');

      const tasks: TransformTask[] = [];
      let isAnyLocked = false;

      response?.forEach((task: TransformTask) => {
        if (task.lock) isAnyLocked = true;
        tasks.push(task);
      });

      setTasks(tasks);

      if (isAnyLocked) {
        setAnyTaskLocked(true);
        pollDbtTasksLock();
      }
    } catch (error) {
      console.error('Error fetching DBT tasks:', error);
      setTasks([]);
    }
  };

  const fetchMoreLogs = async (flow_run_id: string, updateLimit: boolean) => {
    let newMaxLimit = maxLogs;
    if (updateLimit) {
      newMaxLimit += flowRunLogsOffsetLimit;
    }
    setMaxLogs(newMaxLimit);
    await fetchLogs(flow_run_id, newMaxLimit);
  };

  const fetchLogs = async (flow_run_id = flowRunId, maxLogsLimit = maxLogs) => {
    if (!flow_run_id) {
      return;
    }
    setExpandLogs(true);
    (async () => {
      try {
        const currLogsCount = dbtSetupLogsRef?.current?.length;
        if (currLogsCount >= maxLogsLimit) {
          return;
        }
        const data = await httpGet(
          session,
          `prefect/flow_runs/${flow_run_id}/logs?offset=${currLogsCount}&limit=${maxLogsLimit - currLogsCount}`
        );

        if (data?.logs?.logs && data.logs.logs.length > 0) {
          const newlogs = dbtSetupLogsRef.current.concat(data.logs.logs);
          setDbtSetupLogs(newlogs);
          dbtSetupLogsRef.current = newlogs;
        }
      } catch (err: any) {
        console.error(err);
      }
    })();
  };

  return (
    <Box>
      {/* GitHub Repository Connection Section */}
      <DBTRepositoryCard onConnectGit={onConnectGit} />

      {/* DBT Actions */}
      <Box sx={{ mb: 3 }}>
        <DBTTaskList
          tasks={tasks}
          isAnyTaskLocked={anyTaskLocked}
          fetchDbtTasks={fetchDBTTasks}
          fetchLogs={(flow_run_id) => fetchMoreLogs(flow_run_id, false)}
          setFlowRunId={(flow_run_id) => setFlowRunId(flow_run_id)}
          setExpandLogs={setExpandLogs}
          setDbtRunLogs={(logs: string[]) => {
            setDbtSetupLogs(logs);
          }}
        />
      </Box>

      {/* Log Card - Same as original */}
      <LogCard
        logs={dbtSetupLogs}
        expand={expandLogs}
        setExpand={setExpandLogs}
        fetchMore={dbtSetupLogs?.length >= maxLogs}
        fetchMoreLogs={() => fetchMoreLogs(flowRunId, true)}
      />
    </Box>
  );
};

export default DBTTransformTab;
