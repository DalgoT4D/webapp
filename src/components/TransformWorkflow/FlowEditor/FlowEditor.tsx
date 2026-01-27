import { Box, Divider, IconButton, Tab, Tabs } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { OpenInFull, Close, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/LowerSectionTabs/PreviewPane';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { useDbtRunLogs, useDbtRunLogsUpdate } from '@/contexts/DbtRunLogsContext';
import { ReactFlowProvider } from 'reactflow';
import { ResizableBox } from 'react-resizable';
import { TransformTask } from '@/components/DBT/DBTTarget';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { delay } from '@/utils/common';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { LogsPane } from './Components/LowerSectionTabs/LogsPane';
import { StatisticsPane } from './Components/LowerSectionTabs/StatisticsPane';
import { useLockCanvas } from '@/customHooks/useLockCanvas';
import { useTracking } from '@/contexts/TrackingContext';
import { NodeApi } from 'react-arborist';
import { FeatureFlagKeys, useFeatureFlags } from '@/customHooks/useFeatureFlags';
import { DbtModelResponse } from '@/types/transform-v2.types';

type UpperSectionProps = {
  sourcesModels: DbtModelResponse[];
  refreshEditor: boolean;
  setRefreshEditor: any;
  finalLockCanvas: boolean;
  setTempLockCanvas: any;
  isSyncing: boolean;
  onClose?: () => void;
};

const UpperSection = ({
  sourcesModels,
  refreshEditor,
  setRefreshEditor,
  finalLockCanvas,
  setTempLockCanvas,
  isSyncing,
  onClose,
}: UpperSectionProps) => {
  const [width, setWidth] = useState(260);
  const globalContext = useContext(GlobalContext);
  const { setCanvasAction } = useCanvasAction();

  const onResize = (event: any, { size }: any) => {
    setWidth(size.width);
  };

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
        overflow: 'inherit',
        position: 'relative',
      }}
    >
      <ResizableBox
        axis="x"
        width={width}
        onResize={onResize}
        minConstraints={[280, Infinity]}
        maxConstraints={[550, Infinity]}
        resizeHandles={['e']}
      >
        <ProjectTree
          dbtSourceModels={sourcesModels}
          handleNodeClick={handleNodeClick}
          handleSyncClick={initiateSyncSources}
          included_in="visual_designer"
          isSyncing={isSyncing}
          onClose={onClose}
        />
      </ResizableBox>
      <Divider orientation="vertical" sx={{ color: 'black' }} />
      <Box sx={{ width: '100%' }}>
        <ReactFlowProvider>
          <Canvas
            redrawGraph={refreshEditor}
            setRedrawGraph={setRefreshEditor}
            finalLockCanvas={finalLockCanvas}
            setTempLockCanvas={setTempLockCanvas}
          />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

export type LowerSectionTabValues = 'preview' | 'logs' | 'statistics';

type LowerSectionProps = {
  height: number;
  selectedTab: LowerSectionTabValues;
  setSelectedTab: (value: LowerSectionTabValues) => void;
  finalLockCanvas: boolean;
  setFullScreen?: any;
  isMinimized: boolean;
  onToggleMinimize: () => void;
};

export type TaskProgressLog = {
  message: string;
  status: string;
  timestamp: string;
};

const LowerSection = ({
  height,
  selectedTab,
  setSelectedTab,
  setFullScreen,
  finalLockCanvas,
  isMinimized,
  onToggleMinimize,
}: LowerSectionProps) => {
  const dbtRunLogs = useDbtRunLogs();
  const trackAmplitudeEvent = useTracking();
  const handleTabChange = (event: React.SyntheticEvent, newValue: LowerSectionTabValues) => {
    trackAmplitudeEvent(`[${newValue}-tab] Button Clicked`);
    setSelectedTab(newValue);
  };
  const { isFeatureFlagEnabled } = useFeatureFlags();

  return (
    <Box sx={{ height: 'unset' }}>
      <Box
        sx={{
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          background: '#F5FAFA',
          borderTop: '1px solid #CCCCCC',
          borderBottom: '1px solid #CCCCCC',
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          sx={{ display: 'flex', alignItems: 'center', height: '100%', paddingLeft: '28px' }}
        >
          <Tab label="Preview" value="preview" />
          <Tab label="Logs" value="logs" />

          {isFeatureFlagEnabled(FeatureFlagKeys.DATA_STATISTICS) && (
            <Tab label="Data statistics" value="statistics" />
          )}
        </Tabs>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <IconButton
            onClick={onToggleMinimize}
            sx={{ ml: 'auto' }}
            aria-label={isMinimized ? 'Restore panel' : 'Minimize panel'}
            aria-expanded={!isMinimized}
          >
            {isMinimized ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
          <IconButton onClick={setFullScreen} aria-label="Toggle fullscreen">
            <OpenInFull />
          </IconButton>
        </div>
      </Box>
      {!isMinimized && (
        <Box sx={{ height: '100vh' }}>
          {selectedTab === 'preview' && <PreviewPane height={height} />}
          {selectedTab === 'logs' && (
            <LogsPane height={height} dbtRunLogs={dbtRunLogs} finalLockCanvas={finalLockCanvas} />
          )}
          {selectedTab === 'statistics' && <StatisticsPane height={height} />}
        </Box>
      )}
    </Box>
  );
};

const FlowEditor = ({ onClose }: { onClose?: () => void } = {}) => {
  const { data: session } = useSession();
  const [sourcesModels, setSourcesModels] = useState<DbtModelResponse[]>([]);
  const [refreshEditor, setRefreshEditor] = useState<boolean>(false);
  const [lowerSectionHeight, setLowerSectionHeight] = useState(300);
  const [isLowerSectionMinimized, setIsLowerSectionMinimized] = useState<boolean>(false);
  const [lockUpperSection, setLockUpperSection] = useState<boolean>(false);
  const { finalLockCanvas, setTempLockCanvas } = useLockCanvas(lockUpperSection);
  const [selectedTab, setSelectedTab] = useState<LowerSectionTabValues>('logs');
  const [isSyncingSources, setIsSyncingSources] = useState<boolean>(false);
  const hasAutoSynced = useRef(false); // maintains the state -- if the auto sync has run or not.
  const globalContext = useContext(GlobalContext);
  const setDbtRunLogs = useDbtRunLogsUpdate();
  const { canvasAction, setCanvasAction } = useCanvasAction();

  const onResize = (event: any) => {
    const dialogHeight = document.querySelector('.MuiDialog-root')?.clientHeight || 0;
    const newHeight = dialogHeight - event.clientY;
    setLowerSectionHeight(newHeight);
    setIsLowerSectionMinimized(newHeight <= 100);
  };
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
          setSelectedTab('logs');
          await pollForTaskRun(celery_task_id);
        }

        if (isAnyLocked) await delay(5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
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
      // tab to logs
      setSelectedTab('logs');
      // Clear previous logs
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
    }
  };

  const syncSources = async () => {
    try {
      setIsSyncingSources(true);
      // tab to logs
      setSelectedTab('logs');
      // Clear previous logs
      setDbtRunLogs([]);

      const response: any = await httpPost(session, `transform/dbt_project/sync_sources/`, {});

      if (response?.task_id && response?.hashkey) {
        await pollForSyncSourcesTask(response.task_id, response.hashkey);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncingSources(false);
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
      setSelectedTab('logs');
      if (syncSourcesTaskId) await pollForSyncSourcesTask(syncSourcesTaskId, syncSourcesHashKey);
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
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
        height: 'calc(100vh - 56px)',
      }}
    >
      <UpperSection
        setRefreshEditor={setRefreshEditor}
        sourcesModels={sourcesModels}
        refreshEditor={refreshEditor}
        finalLockCanvas={finalLockCanvas}
        setTempLockCanvas={setTempLockCanvas}
        isSyncing={isSyncingSources}
        onClose={onClose}
      />

      <ResizableBox
        axis="y"
        resizeHandles={['n']}
        width={Infinity}
        height={lowerSectionHeight}
        onResize={onResize}
        minConstraints={[Infinity, 100]}
      >
        <LowerSection
          setFullScreen={() => {
            const dialogBox = document.querySelector('.MuiDialog-root');
            if (dialogBox) {
              const fullHeight = dialogBox?.clientHeight - 50;
              setLowerSectionHeight(lowerSectionHeight === fullHeight ? 300 : fullHeight);
            }
          }}
          height={lowerSectionHeight}
          setSelectedTab={setSelectedTab}
          selectedTab={selectedTab}
          finalLockCanvas={finalLockCanvas}
          isMinimized={isLowerSectionMinimized}
          onToggleMinimize={() => {
            const dialogBox = document.querySelector('.MuiDialog-root');
            if (dialogBox) {
              if (isLowerSectionMinimized) {
                setLowerSectionHeight(300);
                setIsLowerSectionMinimized(false);
              } else {
                setLowerSectionHeight(100);
                setIsLowerSectionMinimized(true);
              }
            }
          }}
        />
      </ResizableBox>
    </Box>
  );
};

export default FlowEditor;
