import {
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { OpenInFull } from '@mui/icons-material';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/PreviewPane';
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
import moment from 'moment';

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
  height: number;
  selectedTab: LowerSectionTabValues;
  setSelectedTab: (value: LowerSectionTabValues) => void;
  workflowInProgress: boolean;
  setFullScreen?: any;
};

export type TaskProgressLog = {
  message: string;
  status: string;
};

const LowerSection = ({
  height,
  selectedTab,
  setSelectedTab,
  workflowInProgress,
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
        </Tabs>
        <IconButton sx={{ ml: 'auto' }} onClick={setFullScreen}>
          <OpenInFull />
        </IconButton>
      </Box>
      <Box sx={{ height: '100vh' }}>
        {selectedTab === 'preview' && <PreviewPane height={height} />}
        {selectedTab === 'logs' && (
          <Box
            height={height - 50}
            sx={{ overflow: 'auto', position: 'relative' }}
          >
            {dbtRunLogs.length > 0 ? (
              <Table
                stickyHeader
                sx={{ borderCollapse: 'collapse', width: '100%' }}
              >
                <TableHead>
                  <TableRow>
                    {['Last Run', 'Description'].map((header: any) => (
                      <TableCell
                        key={header.id}
                        colSpan={header.colSpan}
                        sx={{
                          backgroundColor: '#F5FAFA',
                          padding: '10px 20px',
                          textAlign: 'left',
                          fontWeight: 700,
                          minWidth: '200px',
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody sx={{ borderColor: '#dddddd' }}>
                  {dbtRunLogs.map((log: any) => {
                    return (
                      <TableRow
                        key={log.timestamp}
                        sx={{
                          boxShadow: 'none',
                          borderRadius: '0',
                          borderBottom: '1px solid rgba(238, 238, 238, 1)',
                          textAlign: 'left',
                          fontSize: '0.8rem',
                        }}
                      >
                        <TableCell
                          sx={{
                            padding: '10px 20px',
                            fontWeight: 500,
                          }}
                        >
                          {moment(log.timestamp).format('YYYY/MM/DD')}{' '}
                          &nbsp;&nbsp;&nbsp;&nbsp;
                          {moment(log.timestamp).format('hh:mm:ss A ')}
                        </TableCell>
                        <TableCell
                          sx={{
                            padding: '10px 20px',
                            fontWeight: 500,
                          }}
                        >
                          {log.message}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
      const response: { progress: Array<TaskProgressLog> } = await httpGet(
        session,
        `tasks/${taskId}`
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

      const syncSourcesTaskId = globalContext?.CurrentOrg.state.slug;
      const syncSourcesHashKey = `syncsources-${syncSourcesTaskId}`;

      const response: any = await httpPost(
        session,
        `transform/dbt_project/sync_sources/`,
        {}
      );
      await delay(1000);

      if (response?.task_progress_id && syncSourcesTaskId) {
        await pollForSyncSourcesTask(syncSourcesTaskId, syncSourcesHashKey);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLockUpperSection(false);
    }
  };

  const pollForSyncSourcesTask = async (
    taskId: string,
    hashKey = 'taskprogress'
  ) => {
    try {
      const response: any = await httpGet(
        session,
        `tasks/${taskId}?hashkey=${hashKey}`
      );
      setDbtRunLogs(
        response?.progress.map((resp: { status: string; message: string }) => ({
          level: 0,
          timestamp: new Date(),
          message: resp.status,
        }))
      );
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
