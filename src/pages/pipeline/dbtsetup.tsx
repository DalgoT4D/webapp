import { DBTSetup } from '@/components/DBT/DBTSetup';
import { PageHead } from '@/components/PageHead';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import { Box, Button, Card, Link, Tabs, Tab, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import Dbt from '@/assets/images/dbt.png';
import Image from 'next/image';
import { ActionsMenu } from '../../components/UI/Menu/Menu';
import { TransformTask } from '@/components/DBT/DBTTarget';
import { DBTTaskList } from '@/components/DBT/DBTTaskList';
import { DBTDocs } from '@/components/DBT/DBTDocs';
import { delay } from '@/utils/common';
import { LogCard } from '@/components/Logs/LogCard';
import { useRouter } from 'next/router';

type Tasks = TransformTask[];

const Transform = () => {
  const [workspace, setWorkspace] = useState({
    status: '',
    gitrepo_url: '',
    default_schema: '',
  });
  const [tasks, setTasks] = useState<Tasks>([]);
  const [dbtSetupStage, setDbtSetupStage] = useState<string>(''); // create-workspace, complete
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [showConnectRepoDialog, setShowConnectRepoDialog] =
    useState<boolean>(false);
  const [rerender, setRerender] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbtSetupLogs, setDbtSetupLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('setup');
  const handleChangeTab = (event: React.SyntheticEvent, newTab: string) => {
    setActiveTab(newTab);
  };
  const [anyTaskLocked, setAnyTaskLocked] = useState<boolean>(false);

  const { data: session }: any = useSession();
  const router = useRouter();
  const { transform_type } = router.query;
  const globalContext = useContext(GlobalContext);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleEdit = () => {
    setShowConnectRepoDialog(true);
    handleClose();
  };

  type TransformType = 'github' | 'ui';

  const [transformType, setTransformType] = useState<TransformType | null>(null);

  useEffect(() => {
    const fetchTransformType = async () => {
      try {
        if (transformType === null) {
          const res = await httpGet(session, 'dbt/dbt_transform/');
          const { transform_type } = await res;
          console.log(transform_type);
          setIsLoading(false);
          setTransformType(transform_type as TransformType);
        } else {
          const { transform_type: type } = router.query;
          console.log(transformType);
          if (type) {
            setIsLoading(true);
            setTransformType(type as TransformType);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
  
    fetchTransformType();
  }, [transformType, router.query, session]);
  
    
  const handleGoToWorkflow = async () => {
    try {
      const payload = {
        default_schema: 'intermediate'
      };
      await httpPost(session, 'transform/dbt_project/', payload);
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    }
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

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session, rerender]);

  return (
    <>
      <ActionsMenu
        eleType="dbtworkspace"
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        handleEdit={handleEdit}
      />
      <PageHead title="DDP: Transform" />
      <main className={styles.main}>
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
        ) : (
          <>
            <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 3 }}>
              <Tab value="setup" label="Setup"></Tab>
            </Tabs>
            {activeTab === 'setup' && (
              <>
                {(transformType === 'github' || transform_type === 'github') && (
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
                      >
                        Connect & Setup Repo{' '}
                      </Button>
                    ) : (
                      ''
                    )}
                  </Box>
                </Card>
                )}
                
                {(transformType === 'ui' || transform_type === 'ui') && (
                <Link href="/workflow/editor">
                  <Button variant="contained" color="primary" sx={{ width: 'auto' }} onClick={handleGoToWorkflow}>
                    Go to workflow
                  </Button>
                </Link>
                )}
                {dbtSetupStage === 'complete' ? (
                  <DBTTaskList
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

                <Box>
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
                  <LogCard
                    logs={dbtSetupLogs}
                    expand={expandLogs}
                    setExpand={setExpandLogs}
                  />
                </Box>
              </>
            )}
            {activeTab === 'docs' &&
              dbtSetupStage === 'complete' &&
              workspace && <DBTDocs />}
          </>
        )}
      </main>
    </>
  );
};

export default Transform;
