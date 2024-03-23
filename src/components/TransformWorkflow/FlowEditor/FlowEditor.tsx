import {
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/PreviewPane';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { SRC_MODEL_NODE } from './constant';
import { DbtSourceModel } from './Components/Canvas';
import {
  useDbtRunLogs,
  useDbtRunLogsUpdate,
} from '@/contexts/DbtRunLogsContext';
import { ReactFlowProvider } from 'reactflow';
import { ResizableBox } from 'react-resizable';
import {
  PrefectFlowRun,
  PrefectFlowRunLog,
  TransformTask,
} from '@/components/DBT/DBTTarget';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { TASK_DBTDEPS, TASK_DBTRUN } from '@/config/constant';
import { GlobalContext } from '@/contexts/ContextProvider';
import { delay } from '@/utils/common';
import { useCanvasAction } from '@/contexts/FlowEditorCanvasContext';

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
  lockUpperSection,
}: UpperSectionProps) => {
  const [width, setWidth] = useState(260);

  const onResize = (event: any, { node, size, handle }: any) => {
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
      <Backdrop
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          position: 'absolute', // Position the Backdrop over the Box
          top: 0,
          left: 0,
          right: 0,
          bottom: 0, // Cover the entire Box
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={lockUpperSection}
        onClick={() => {}}
      >
        <CircularProgress
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 2,
          }}
        />
      </Backdrop>

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
          />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
};

export type LowerSectionTabValues = 'preview' | 'logs';

type LowerSectionProps = {
  selectedTab: LowerSectionTabValues;
  setSelectedTab: (value: LowerSectionTabValues) => void;
  workflowInProgress: boolean;
};

const LowerSection = ({
  selectedTab,
  setSelectedTab,
  workflowInProgress,
}: LowerSectionProps) => {
  const dbtRunLogs = useDbtRunLogs();
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: LowerSectionTabValues
  ) => {
    setSelectedTab(newValue);
  };
  return (
    <Box height={'100%'}>
      <Box
        sx={{
          height: '50px',
          background: '#F8F8F8',
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
        </Tabs>
      </Box>
      <Box
        height={'calc(100% - 50px)'}
        sx={{ overflow: 'auto', position: 'relative' }}
      >
        {selectedTab === 'preview' && <PreviewPane />}
        {selectedTab === 'logs' && (
          <Box height={'100%'} sx={{ padding: '1rem' }}>
            {dbtRunLogs.length > 0 ? (
              dbtRunLogs.map((log, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ fontWeight: 700, minWidth: '25%' }}>
                    {new Date(log.timestamp).toTimeString()}
                  </Box>
                  <Box sx={{ color: 'blue', textAlign: 'left', width: '100%' }}>
                    {log.message}
                  </Box>
                </Box>
              ))
            ) : workflowInProgress ? (
              <Backdrop
                sx={{
                  background: 'white',
                  position: 'absolute', // Position the Backdrop over the Box
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0, // Cover the entire Box
                  zIndex: (theme) => theme.zIndex.drawer + 1,
                }}
                open={workflowInProgress}
                onClick={() => {}}
              >
                <CircularProgress
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 2,
                  }}
                />
              </Backdrop>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                Please press run
              </Box>
            )}
          </Box>
        )}
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

  const onResize = (_event: any, { size }: any) => {
    setLowerSectionHeight(size.height);
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
        const logsArray: PrefectFlowRunLog[] = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) => logObject
        );

        setDbtRunLogs(logsArray);
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

  const checkForAnyRunningDbtJob = async () => {
    setLockUpperSection(true);
    let isAnyLocked = true;
    let flow_run_id: string | undefined = '';
    try {
      while (isAnyLocked) {
        isAnyLocked = false;

        const response = await httpGet(session, 'prefect/tasks/transform/');
        response?.forEach((task: TransformTask) => {
          if (task.lock) {
            isAnyLocked = true;
            flow_run_id = task.lock?.flowRunId;
          }
        });

        if (flow_run_id) {
          setSelectedTab('logs');
          await pollForFlowRun(flow_run_id);
        }

        if (isAnyLocked) await delay(5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
    }
  };

  const handleRunWorkflow = async () => {
    try {
      setLockUpperSection(true);
      // tab to logs
      setSelectedTab('logs');
      // Clear previous logs
      setDbtRunLogs([]);

      const tasks: any = await httpGet(session, `prefect/tasks/transform/`);

      const dbtDepsTask = tasks.find((task: any) => task.slug === TASK_DBTDEPS);

      if (dbtDepsTask) {
        successToast('Installing dependencies', [], globalContext);
        await httpPost(session, `prefect/tasks/${dbtDepsTask.uuid}/run/`, {});
      }

      const dbtRunTask = tasks.find((task: any) => task.slug === TASK_DBTRUN);

      if (dbtRunTask) {
        const response = await httpPost(
          session,
          `prefect/v1/flows/${dbtRunTask.deploymentId}/flow_run/`,
          {}
        );
        successToast('Dbt run initiated', [], globalContext);

        if (response.flow_run_id) await pollForFlowRun(response.flow_run_id);

        // refresh canvas
        setRefreshEditor(!refreshEditor);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLockUpperSection(false);
    }
  };

  useEffect(() => {
    if (session) {
      checkForAnyRunningDbtJob();
      fetchSourcesModels();
    }
  }, [session, refreshEditor]);

  useEffect(() => {
    if (canvasAction.type === 'run-workflow') {
      handleRunWorkflow();
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
        maxConstraints={[Infinity, 500]}
      >
        <LowerSection
          setSelectedTab={setSelectedTab}
          selectedTab={selectedTab}
          workflowInProgress={lockUpperSection}
        />
      </ResizableBox>
    </Box>
  );
};

export default FlowEditor;
