import { DBTSetup } from '@/components/DBT/DBTSetup';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import {
  Box,
  Button,
  Card,
  Link,
  Tabs,
  Tab,
  Typography,
  Dialog,
  Slide,
  IconButton,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useRef, useState } from 'react';
import Dbt from '@/assets/images/dbt.png';
import Image from 'next/image';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import { TransformTask } from '@/components/DBT/DBTTarget';
import { DBTTaskList } from '@/components/DBT/DBTTaskList';
import { DBTDocs } from '@/components/DBT/DBTDocs';
import { delay } from '@/utils/common';
import { LogCard } from '@/components/Logs/LogCard';
import { TransitionProps } from '@mui/material/transitions';
import WorkflowEditor from '@/components/Workflow/Editor';
import Close from '@mui/icons-material/Close';
import Logo from '@/assets/images/logo.svg';
import { TransformType } from '@/pages/pipeline/transform';
import { flowRunLogsOffsetLimit } from '@/config/constant';

export const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} timeout={400} />;
});

const TopNavBar = ({ handleClose }: any) => (
  <Box sx={{ display: 'flex' }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        ml: 1.8,
        height: '56px',
      }}
    >
      <Image src={Logo} alt="dalgo logo" />
    </Box>
    <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleClose}
        sx={{ mr: 1 }}
        aria-label="close"
      >
        <Close />
      </IconButton>
    </Box>
  </Box>
);

type Tasks = TransformTask[];

type DBTSetupStage = 'create-workspace' | 'complete' | '';

const DBTTransformType = ({
  transformType,
}: {
  transformType: TransformType;
}) => {
  const [workspace, setWorkspace] = useState({
    status: '',
    gitrepo_url: '',
    default_schema: '',
  });
  const [tasks, setTasks] = useState<Tasks>([]);
  const [flowRunId, setFlowRunId] = useState('');
  const [maxLogs, setMaxLogs] = useState<number>(flowRunLogsOffsetLimit);
  const dbtSetupLogsRef = useRef<string[]>([]);
  const [dbtSetupStage, setDbtSetupStage] = useState<DBTSetupStage>(''); // create-workspace, complete
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [showConnectRepoDialog, setShowConnectRepoDialog] =
    useState<boolean>(false);
  const [rerender, setRerender] = useState<boolean>(false);
  const [dbtSetupLogs, setDbtSetupLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('setup');
  const handleChangeTab = (event: React.SyntheticEvent, newTab: string) => {
    setActiveTab(newTab);
  };
  const [anyTaskLocked, setAnyTaskLocked] = useState<boolean>(false);

  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleEdit = () => {
    setShowConnectRepoDialog(true);
    handleClose();
  };

  const [showWorkFlow, setShowWorkflow] = useState(false);

  const dialog = (
    <Dialog fullScreen open={showWorkFlow} TransitionComponent={Transition}>
      <TopNavBar handleClose={() => setShowWorkflow(false)} />
      {showWorkFlow && <WorkflowEditor />}
    </Dialog>
  );

  const handleGoToWorkflow = () => {
    setShowWorkflow(true);
  };

  const fetchDbtWorkspace = async () => {
    if (!session) return;

    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');
      setDbtSetupStage('create-workspace');
      if (response.error === 'no dbt workspace has been configured') {
        setWorkspace({ ...workspace, status: 'fetched' });
        // do nothing
      } else if (response.error) {
        errorToast(response.error, [], globalContext);
      } else {
        response.status = 'fetched';
        setWorkspace(response);
        fetchDbtTasks();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const pollDbtTasksLock = async () => {
    try {
      let isLocked = true;
      while (isLocked) {
        const response = await httpGet(session, 'prefect/tasks/transform/');

        isLocked = response?.some((task: TransformTask) =>
          task.lock ? true : false
        );
        await delay(3000);
      }
      setAnyTaskLocked(false);
    } catch (error) {
      setAnyTaskLocked(false);
    }
  };

  const fetchDbtTasks = async () => {
    if (!session) return;
    try {
      const response = await httpGet(session, 'prefect/tasks/transform/');

      const tasks: TransformTask[] = [];

      let isAnyLocked = false;
      response?.forEach((task: TransformTask) => {
        if (task.lock) isAnyLocked = true;
        tasks.push(task);
      });

      setTasks(tasks);

      if (response && response?.length > 0) {
        setDbtSetupStage('complete');
      }

      if (isAnyLocked) {
        setAnyTaskLocked(true);
        pollDbtTasksLock();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const createProfile = async () => {
    try {
      await httpPost(session, `prefect/tasks/transform/`, {});
      setDbtSetupStage('complete');
      fetchDbtTasks();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
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
        errorToast(err.message, [], globalContext);
      }
    })();
  };

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session, rerender]);

  useEffect(() => {
    dbtSetupLogsRef.current = dbtSetupLogs;
  }, [dbtSetupLogs]);

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEdit}
      />
      <Box>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Transformation
        </Typography>
        {globalContext?.CurrentOrg.state.wtype === 'snowflake' ? (
          <Typography variant="h4" sx={{ alignContent: 'center' }}>
            dbt not available for snowflake warehouses at this time
          </Typography>
        ) : ['complete', 'create-workspace'].includes(dbtSetupStage) ? (
          <>
            <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 3 }}>
              <Tab value="setup" label="Setup"></Tab>
            </Tabs>
            {activeTab === 'setup' && (
              <Box>
                <Box>
                  {transformType === 'ui' ? (
                    <Box>
                      {dbtSetupStage === 'complete' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ width: 'auto' }}
                          data-testid="gotoworkflow"
                          onClick={handleGoToWorkflow}
                        >
                          Go to workflow
                        </Button>
                      ) : (
                        ''
                      )}
                    </Box>
                  ) : transformType === 'github' ? (
                    <Box>
                      <Card
                        sx={{
                          background: 'white',
                          display: 'flex',
                          borderRadius: '8px',
                          padding: '16px',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <Image
                            src={Dbt}
                            alt="Banner"
                            style={{ width: '46px', height: '46px' }}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '5px',
                            }}
                          >
                            <Typography
                              sx={{ fontWeight: 700 }}
                              variant="h4"
                              color="#000"
                            >
                              DBT REPOSITORY
                            </Typography>
                            {workspace && workspace.gitrepo_url ? (
                              <>
                                <Link
                                  sx={{
                                    backgroundColor: '#F2F2EB',
                                    borderRadius: '6px',
                                    padding: '3px 6px 3px 6px',
                                    width: 'min-content',
                                    display: 'inline-flex',
                                    textDecoration: 'none',
                                    ':hover': { cursor: 'pointer' },
                                  }}
                                  target="_blank"
                                  rel="noopener"
                                  href={workspace.gitrepo_url}
                                >
                                  <Typography
                                    sx={{ fontWeight: 600, color: '#0F2440' }}
                                  >
                                    {workspace.gitrepo_url}
                                  </Typography>
                                </Link>
                                <Box
                                  sx={{
                                    backgroundColor: '#F2F2EB',
                                    borderRadius: '6px',
                                    padding: '3px 6px 3px 6px',
                                    width: 'min-content',
                                    display: 'inline-flex',
                                  }}
                                >
                                  <Typography
                                    sx={{ fontWeight: 600, color: '#0F2440' }}
                                  >
                                    {workspace?.default_schema}
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              ''
                            )}
                          </Box>
                        </Box>
                        <Box>
                          {dbtSetupStage === 'create-workspace' ? (
                            <Button
                              variant="contained"
                              onClick={() => setShowConnectRepoDialog(true)}
                              disabled={
                                !permissions.includes(
                                  'can_create_dbt_workspace'
                                )
                              }
                            >
                              Connect & Setup Repo{' '}
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              onClick={() => setShowConnectRepoDialog(true)}
                              disabled={
                                !permissions.includes('can_edit_dbt_workspace')
                              }
                            >
                              Edit
                            </Button>
                          )}
                        </Box>
                      </Card>
                      {dbtSetupStage === 'create-workspace' ? (
                        <DBTSetup
                          setLogs={setDbtSetupLogs}
                          setExpandLogs={setExpandLogs}
                          onCreateWorkspace={() => {
                            createProfile();
                            setRerender(!rerender);
                          }}
                          showDialog={showConnectRepoDialog}
                          setShowDialog={setShowConnectRepoDialog}
                          gitrepoUrl=""
                          schema=""
                          mode="create"
                          setWorkspace={setWorkspace}
                        />
                      ) : dbtSetupStage === 'complete' && workspace ? (
                        <DBTSetup
                          setLogs={setDbtSetupLogs}
                          setExpandLogs={setExpandLogs}
                          onCreateWorkspace={async () => {
                            await fetchDbtWorkspace();
                          }}
                          showDialog={showConnectRepoDialog}
                          setShowDialog={setShowConnectRepoDialog}
                          gitrepoUrl={workspace?.gitrepo_url}
                          schema={workspace?.default_schema}
                          mode="edit"
                          setWorkspace={setWorkspace}
                        />
                      ) : (
                        ''
                      )}
                    </Box>
                  ) : (
                    ''
                  )}
                  {dbtSetupStage === 'complete' ? (
                    <DBTTaskList
                      fetchLogs={(flow_run_id) =>
                        fetchMoreLogs(flow_run_id, false)
                      }
                      setFlowRunId={(flow_run_id) => setFlowRunId(flow_run_id)}
                      setExpandLogs={setExpandLogs}
                      setDbtRunLogs={(logs: string[]) => {
                        setDbtSetupLogs(logs);
                      }}
                      tasks={tasks}
                      isAnyTaskLocked={anyTaskLocked}
                      fetchDbtTasks={fetchDbtTasks}
                    />
                  ) : (
                    ''
                  )}
                  <LogCard
                    logs={dbtSetupLogs}
                    expand={expandLogs}
                    setExpand={setExpandLogs}
                    fetchMore={dbtSetupLogs?.length >= maxLogs}
                    fetchMoreLogs={() => fetchMoreLogs(flowRunId, true)}
                  />
                </Box>
              </Box>
            )}
            {activeTab === 'docs' &&
              dbtSetupStage === 'complete' &&
              workspace && <DBTDocs />}
          </>
        ) : (
          ''
        )}
        {dialog}
      </Box>
    </>
  );
};

export default DBTTransformType;
