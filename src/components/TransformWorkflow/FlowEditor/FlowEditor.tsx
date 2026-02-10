import { Box, IconButton } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { useDbtRunLogsUpdate } from '@/contexts/DbtRunLogsContext';
import { ReactFlowProvider } from 'reactflow';
import { TransformTask } from '@/components/DBT/DBTTarget';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { delay } from '@/utils/common';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { useLockCanvas } from '@/customHooks/useLockCanvas';
import { NodeApi } from 'react-arborist';
import { DbtModelResponse } from '@/types/transform-v2.types';

type UpperSectionProps = {
  sourcesModels: DbtModelResponse[];
  refreshEditor: boolean;
  setRefreshEditor: any;
  finalLockCanvas: boolean;
  setTempLockCanvas: any;
  isSyncing: boolean;
  isRunning: boolean;
  onClose?: () => void;
};

const UpperSection = ({
  sourcesModels,
  refreshEditor,
  setRefreshEditor,
  finalLockCanvas,
  setTempLockCanvas,
  isSyncing,
  isRunning,
  onClose,
}: UpperSectionProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const globalContext = useContext(GlobalContext);
  const { setCanvasAction } = useCanvasAction();

  const handleNodeClick = (nodes: NodeApi<any>[]) => {
    if (nodes.length > 0 && nodes[0].isLeaf) {
      console.log('adding a node to canvas from project tree component', nodes[0].data);
      setCanvasAction({ type: 'add-srcmodel-node', data: nodes[0].data });
    }
  };

  const initiateSyncSources = () => {
    const permissions = globalContext?.Permissions.state || [];
    if (permissions.includes('can_sync_sources')) {
      setCanvasAction({ type: 'sync-sources', data: null });
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sidebar toggle button */}
      <IconButton
        onClick={() => setSidebarOpen(!sidebarOpen)}
        sx={{
          position: 'absolute',
          left: 8,
          top: 52,
          zIndex: 1100,
          backgroundColor: 'white',
          border: '1px solid #E0E0E0',
          '&:hover': { backgroundColor: '#F5F5F5' },
        }}
      >
        {sidebarOpen ? <ChevronLeftIcon /> : <AccountTreeIcon />}
      </IconButton>

      {/* Backdrop overlay when sidebar is open */}
      {sidebarOpen && (
        <Box
          onClick={() => setSidebarOpen(false)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 1040,
          }}
        />
      )}

      {/* Slide-over sidebar panel */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '320px',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 250ms ease-in-out',
          zIndex: 1050,
          boxShadow: sidebarOpen ? '4px 0 12px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <ProjectTree
          dbtSourceModels={sourcesModels}
          handleNodeClick={handleNodeClick}
          handleSyncClick={initiateSyncSources}
          included_in="visual_designer"
          isSyncing={isSyncing}
          onClose={() => setSidebarOpen(false)}
        />
      </Box>

      {/* Canvas takes full width */}
      <Box sx={{ width: '100%' }}>
        <ReactFlowProvider>
          <Canvas
            redrawGraph={refreshEditor}
            setRedrawGraph={setRefreshEditor}
            finalLockCanvas={finalLockCanvas}
            setTempLockCanvas={setTempLockCanvas}
            isRunning={isRunning}
          />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

export type TaskProgressLog = {
  message: string;
  status: string;
  timestamp: string;
};

const FlowEditor = ({ onClose }: { onClose?: () => void } = {}) => {
  const { data: session } = useSession();
  const [sourcesModels, setSourcesModels] = useState<DbtModelResponse[]>([]);
  const [refreshEditor, setRefreshEditor] = useState<boolean>(false);
  const [lockUpperSection, setLockUpperSection] = useState<boolean>(false);
  const { finalLockCanvas, setTempLockCanvas } = useLockCanvas(lockUpperSection);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSyncingSources, setIsSyncingSources] = useState<boolean>(false);
  const hasAutoSynced = useRef(false);
  const globalContext = useContext(GlobalContext);
  const setDbtRunLogs = useDbtRunLogsUpdate();
  const { canvasAction, setCanvasAction } = useCanvasAction();

  const fetchSourcesModels = () => {
    httpGet(session, 'transform/v2/dbt_project/sources_models/')
      .then((response: DbtModelResponse[]) => {
        setSourcesModels(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const checkForAnyRunningDbtJob = async () => {
    setLockUpperSection(true);
    let isAnyLocked = true;
    let celery_task_id: string | undefined = '';
    try {
      while (isAnyLocked) {
        isAnyLocked = false;

        const response = await httpGet(session, 'prefect/tasks/transform/');
        response?.forEach((task: TransformTask) => {
          if (task.lock) {
            isAnyLocked = true;
            celery_task_id = task.lock?.celeryTaskId;
          }
        });

        if (celery_task_id) {
          setIsRunning(true);
          await pollForTaskRun(celery_task_id);
        }

        if (isAnyLocked) await delay(5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
      setIsRunning(false);
    }
  };

  const pollForTaskRun = async (taskId: string) => {
    try {
      const orgSlug = globalContext?.CurrentOrg.state.slug;
      const hashKey = `run-dbt-commands-${orgSlug}`;
      const response: { progress: Array<TaskProgressLog> } = await httpGet(
        session,
        `tasks/${taskId}?hashkey=${hashKey}`
      );
      setDbtRunLogs(response['progress']);

      const lastMessage: TaskProgressLog = response['progress'][response['progress'].length - 1];

      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(2000);
        await pollForTaskRun(taskId);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const handleRunWorkflow = async (runParams: object) => {
    try {
      setLockUpperSection(true);
      setIsRunning(true);
      setDbtRunLogs([]);

      console.log('data passed for run_dbt_via_celery', runParams);

      const response: any = await httpPost(session, 'dbt/run_dbt_via_celery/', runParams);

      successToast('Dbt run initiated', [], globalContext);

      if (response?.task_id) {
        await delay(2000);
        await pollForTaskRun(response.task_id);
        setRefreshEditor(!refreshEditor);
      }
      setCanvasAction({ type: 'refresh-canvas', data: null });
    } catch (error) {
      console.log(error);
    } finally {
      setLockUpperSection(false);
      setIsRunning(false);
    }
  };

  const syncSources = async () => {
    try {
      setIsSyncingSources(true);
      setIsRunning(true);
      setDbtRunLogs([]);

      const response: any = await httpPost(session, `transform/dbt_project/sync_sources/`, {});

      if (response?.task_id && response?.hashkey) {
        await pollForSyncSourcesTask(response.task_id, response.hashkey);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncingSources(false);
      setIsRunning(false);
    }
  };

  const pollForSyncSourcesTask = async (taskId: string, hashKey: string) => {
    try {
      const response: any = await httpGet(session, `tasks/${taskId}?hashkey=${hashKey}`);
      if (response && response?.progress) {
        setDbtRunLogs(
          response?.progress.map((resp: { status: string; message: string }) => ({
            level: 0,
            timestamp: new Date(),
            message: resp.message,
          }))
        );
        if (response.progress.length > 0) {
          const lastMessage = response.progress[response.progress.length - 1];
          if (lastMessage.status === 'completed') {
            successToast('Sync Sources completed', [], globalContext);
            fetchSourcesModels();
            return;
          }
          if (lastMessage.status === 'failed') {
            errorToast('Sync Sources failed', [], globalContext);
            return;
          }
        }
      }
      await delay(3000);
      await pollForSyncSourcesTask(taskId, hashKey);
    } catch (error: any) {
      console.log(error);
    }
  };

  const checkForSyncSourcesTask = async () => {
    const syncSourcesTaskId = globalContext?.CurrentOrg.state.slug;
    const syncSourcesHashKey = `syncsources-${syncSourcesTaskId}`;
    try {
      setLockUpperSection(true);
      setIsRunning(true);
      if (syncSourcesTaskId) await pollForSyncSourcesTask(syncSourcesTaskId, syncSourcesHashKey);
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
      setIsRunning(false);
    }
  };

  const checkForAnyRunningProcess = async () => {
    await checkForAnyRunningDbtJob();
    await checkForSyncSourcesTask();
  };

  useEffect(() => {
    if (session) {
      (async () => {
        await checkForAnyRunningProcess();
        fetchSourcesModels();
        // Auto-sync sources only on first open, not on refreshEditor changes
        if (!hasAutoSynced.current) {
          const permissions = globalContext?.Permissions.state || [];
          if (permissions.includes('can_sync_sources')) {
            hasAutoSynced.current = true;
            setCanvasAction({ type: 'sync-sources', data: null });
          }
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, refreshEditor]);

  useEffect(() => {
    if (canvasAction.type === 'run-workflow') {
      handleRunWorkflow(canvasAction.data);
    }

    if (canvasAction.type === 'sync-sources') {
      (async () => {
        await syncSources();
        fetchSourcesModels();
      })();
    }
  }, [canvasAction]);

  return (
    <Box
      sx={{
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <UpperSection
        setRefreshEditor={setRefreshEditor}
        sourcesModels={sourcesModels}
        refreshEditor={refreshEditor}
        finalLockCanvas={finalLockCanvas}
        setTempLockCanvas={setTempLockCanvas}
        isSyncing={isSyncingSources}
        isRunning={isRunning}
        onClose={onClose}
      />
    </Box>
  );
};

export default FlowEditor;
