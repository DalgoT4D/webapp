import {
  Box,
  Divider,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { OpenInFull } from '@mui/icons-material';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/LowerSectionTabs/PreviewPane';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { DbtSourceModel } from './Components/Canvas';
import {
  useDbtRunLogs,
  useDbtRunLogsUpdate,
} from '@/contexts/DbtRunLogsContext';
import { ReactFlowProvider } from 'reactflow';
import { ResizableBox } from 'react-resizable';
import { TransformTask } from '@/components/DBT/DBTTarget';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { delay } from '@/utils/common';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';
import { LogsPane } from './Components/LowerSectionTabs/LogsPane';
import { StatisticsPane } from './Components/LowerSectionTabs/StatisticsPane';
import { showDataInsightsTab } from '@/config/constant';

type UpperSectionProps = {
  sourcesModels: DbtSourceModel[];
  refreshEditor: boolean;
  setRefreshEditor: any;
  lockUpperSection: boolean;
};

const UpperSection = ({
  sourcesModels,
  refreshEditor,
  setRefreshEditor,
  lockUpperSection
}: UpperSectionProps) => {
  const [width, setWidth] = useState(260);

  const onResize = (event: any, { size }: any) => {
    setWidth(size.width);
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
        <ProjectTree dbtSourceModels={sourcesModels} />
      </ResizableBox>
      <Divider orientation="vertical" sx={{ color: 'black' }} />
      <Box sx={{ width: '100%' }}>
        <ReactFlowProvider>
          <Canvas
            redrawGraph={refreshEditor}
            setRedrawGraph={setRefreshEditor}
            lockUpperSection={lockUpperSection}
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
  workflowInProgress: boolean;
  setFullScreen?: any;
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
}: LowerSectionProps) => {
  const dbtRunLogs = useDbtRunLogs();

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: LowerSectionTabValues
  ) => {
    setSelectedTab(newValue);
  };
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
          sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
        >
          <Tab label="Preview" value="preview" />
          <Tab label="Logs" value="logs" />

          {showDataInsightsTab && (
            <Tab label="Data statistics" value="statistics" />
          )}
        </Tabs>
        <IconButton sx={{ ml: 'auto' }} onClick={setFullScreen}>
          <OpenInFull />
        </IconButton>
      </Box>
      <Box sx={{ height: '100vh' }}>
        {selectedTab === 'preview' && <PreviewPane height={height} />}
        {selectedTab === 'logs' && (
          <LogsPane
            height={height}
            dbtRunLogs={dbtRunLogs}
          />
        )}
        {selectedTab === 'statistics' && <StatisticsPane height={height} />}
      </Box>
    </Box>
  );
};

const FlowEditor = ({}) => {
  const { data: session } = useSession();
  const [sourcesModels, setSourcesModels] = useState<DbtSourceModel[]>([]);
  const [refreshEditor, setRefreshEditor] = useState<boolean>(false);
  const [lowerSectionHeight, setLowerSectionHeight] = useState(300);
  const [lockUpperSection, setLockUpperSection] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] =
    useState<LowerSectionTabValues>('preview');
  const globalContext = useContext(GlobalContext);
  const setDbtRunLogs = useDbtRunLogsUpdate();
  const { canvasAction } = useCanvasAction();

  const onResize = (event: any) => {
    const dailogHeight =
      document.querySelector('.MuiDialog-root')?.clientHeight || 0;
    setLowerSectionHeight(dailogHeight - event.clientY);
  };
  const fetchSourcesModels = () => {
    httpGet(session, 'transform/dbt_project/sources_models/')
      .then((response: DbtSourceModel[]) => {
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

      const lastMessage: TaskProgressLog =
        response['progress'][response['progress'].length - 1];

      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(2000);
        await pollForTaskRun(taskId);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const handleRunWorkflow = async () => {
    try {
      setLockUpperSection(true);
      // tab to logs
      setSelectedTab('logs');
      // Clear previous logs
      setDbtRunLogs([]);

      const response: any = await httpPost(
        session,
        'dbt/run_dbt_via_celery/',
        {}
      );

      successToast('Dbt run initiated', [], globalContext);

      if (response?.task_id) {
        await delay(2000);
        await pollForTaskRun(response.task_id);
        setRefreshEditor(!refreshEditor);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLockUpperSection(false);
    }
  };

  const syncSources = async () => {
    try {
      setLockUpperSection(true);
      // tab to logs
      setSelectedTab('logs');
      // Clear previous logs
      setDbtRunLogs([]);

      const orgslug = globalContext?.CurrentOrg.state.slug;
      const syncSourcesHashKey = `syncsources-${orgslug}`;

      const response: any = await httpPost(
        session,
        `transform/dbt_project/sync_sources/`,
        {}
      );

      if (response?.task_id && orgslug) {
        await pollForSyncSourcesTask(response.task_id, syncSourcesHashKey);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
    }
  };

  const pollForSyncSourcesTask = async (taskId: string, hashKey: string) => {
    try {
      const response: any = await httpGet(
        session,
        `tasks/${taskId}?hashkey=${hashKey}`
      );
      if (response && response?.progress) {
        setDbtRunLogs(
          response?.progress.map(
            (resp: { status: string; message: string }) => ({
              level: 0,
              timestamp: new Date(),
              message: resp.message,
            })
          )
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
      if (syncSourcesTaskId)
        await pollForSyncSourcesTask(syncSourcesTaskId, syncSourcesHashKey);
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
      })();
    }
  }, [session, refreshEditor]);

  useEffect(() => {
    if (canvasAction.type === 'run-workflow') {
      handleRunWorkflow();
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
        lockUpperSection={lockUpperSection}
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
              setLowerSectionHeight(
                lowerSectionHeight === fullHeight ? 300 : fullHeight
              );
            }
          }}
          height={lowerSectionHeight}
          setSelectedTab={setSelectedTab}
          selectedTab={selectedTab}
          workflowInProgress={lockUpperSection}
        />
      </ResizableBox>
    </Box>
  );
};

export default FlowEditor;
