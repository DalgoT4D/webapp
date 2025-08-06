import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { httpGet, httpPost } from '@/helpers/http';
import moment from 'moment';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { delay } from '@/utils/common';
import SyncIcon from '@/assets/icons/sync.svg';
import Image from 'next/image';
import styles from '@/styles/Common.module.css';

type ElementaryStatus = {
  exists: {
    elementary_package?: {
      package: string;
      version: string;
      needs_upgrade?: string;
    };
    elementary_target_schema?: {
      schema?: string;
      '+schema'?: string;
    };
  };
  missing: {
    elementary_package?: string;
    elementary_target_schema?: string;
  };
};

const isEmpty = (obj: any) => Object.keys(obj).length === 0;

const MappingComponent = ({ elementaryStatus }: { elementaryStatus: ElementaryStatus | null }) => {
  if (!elementaryStatus) return null;
  const hasExists = !isEmpty(elementaryStatus.exists);
  const hasMissing = !isEmpty(elementaryStatus.missing);

  // Don't render if both sections are empty
  if (!hasExists && !hasMissing) {
    return null;
  }

  return (
    <Box
      sx={{
        margin: 'auto',
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
      }}
    >
      {hasExists && (
        <Card sx={{ flex: 0.5 }} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Existing
            </Typography>
            <List>
              {Object.entries(elementaryStatus.exists).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key === 'elementary_package' ? 'packages.yml' : 'dbt_project.yml'}
                    secondary={
                      typeof value === 'object' ? (
                        <Box
                          component="pre"
                          sx={{
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#f4f4f4',
                            padding: 2,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                          }}
                        >
                          {JSON.stringify(value, null, 2)}
                        </Box>
                      ) : (
                        value
                      )
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {hasMissing && (
        <Card sx={{ flex: 1 }} variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Missing : Please add these missing lines to your dbt project
            </Typography>
            <List>
              {Object.entries(elementaryStatus.missing).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key === 'elementary_package' ? 'packages.yml' : 'dbt_project.yml'}
                    secondary={
                      <Box
                        component="pre"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          backgroundColor: '#f4f4f4',
                          padding: 2,
                          borderRadius: 1,
                          fontFamily: 'monospace',
                        }}
                      >
                        {value}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export const Elementary = () => {
  const [loading, setLoading] = useState(true);
  const [elementaryToken, setElementaryToken] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [generateReportLock, setGenerateReportLock] = useState(false);
  const globalContext = useContext(GlobalContext);
  const [showSetupElementaryButtom, setShowSetupElementaryButtom] = useState(false);
  const [dbtStatus, setDbtStatus] = useState('');
  const [elementaryStatus, setElementaryStatus] = useState<ElementaryStatus | null>(null);
  const [upgradeMessage, setUpgradeMessage] = useState<string>('');
  const [upgradeInProgress, setUpgradeInProgress] = useState(false);
  const { data: session }: any = useSession();

  const refreshReport = async () => {
    if (!session) return;
    try {
      setGenerateReportLock(true);
      const response = await httpPost(session, 'dbt/v1/refresh-elementary-report/', {});

      if (response.flow_run_id) {
        successToast(
          'Your latest report is being generated. This may take a few minutes. Thank you for your patience',
          [],
          globalContext
        );
        checkForLock();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
      setGenerateReportLock(false);
    }
  };

  const fetchElementaryToken = async () => {
    try {
      const response = await httpPost(session, 'dbt/fetch-elementary-report/', {});

      if (response.token) {
        setElementaryToken(response.token);
        setGeneratedAt(moment(response.created_on_utc).fromNow());
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const checkForLock = async () => {
    try {
      const response = await httpGet(session, `prefect/tasks/elementary-lock/`);
      if (response && !generateReportLock) {
        setGenerateReportLock(true);
        await delay(5000);

        checkForLock();
      } else if (generateReportLock) {
        setGenerateReportLock(false);
        successToast('Report generated successfully', [], globalContext);
        fetchElementaryToken();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
      setGenerateReportLock(false);
    }
  };

  const checkElementarySetupStatus = async () => {
    try {
      const response = await httpGet(session, `dbt/elementary-setup-status`);

      if (response.status == 'set-up') {
        handleCheckDbtFiles(false);
        fetchElementaryToken();
        checkForLock();
      } else if (response.status == 'not-set-up') {
        //setup elementary button
        setShowSetupElementaryButtom(true);
      }
    } catch (err: any) {
      if (err.message === 'dbt is not configured for this client') {
        setDbtStatus('dbt is not configured for this client');
      }
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (session) {
      checkElementarySetupStatus();
    }
  }, [session]);

  const pollForTaskRun = async (taskId: string, hashKey: string) => {
    const response = await httpGet(session, `tasks/${taskId}?hashkey=${hashKey}`);
    const lastMessage: any =
      response['progress'] && response['progress'].length > 0
        ? response['progress'][response['progress'].length - 1]
        : null;

    if (!['completed', 'failed'].includes(lastMessage?.status)) {
      await delay(3000);
      await pollForTaskRun(taskId, hashKey);
    } else if (lastMessage?.status === 'failed') {
      errorToast(lastMessage?.message, [], globalContext);
      return;
    } else if (lastMessage?.status === 'completed') {
      successToast(lastMessage?.message, [], globalContext);
    } else {
      throw new Error('Error while running the task.');
    }
  };
  const createElementaryProfile = async () => {
    const response = await httpPost(session, `dbt/create-elementary-profile/`, {});
    if (response.status && response.status == 'success') {
      successToast('Elementary profile created successfully', [], globalContext);
    } else {
      throw new Error('Failed to create elementary profile');
    }
  };
  const createElementaryTrackingTables = async () => {
    const response = await httpPost(session, `dbt/create-elementary-tracking-tables/`, {});
    if (response.task_id && response.hashkey) {
      await delay(3000);
      await pollForTaskRun(response.task_id, response.hashkey);
    } else {
      throw new Error('failed to fetch task_id');
    }
  };
  const createEdrDeployment = async () => {
    const response = await httpPost(session, `dbt/create-edr-deployment/`, {});

    if (response.status && response.status === 'success') {
      successToast('Edr deployment created successfully', [], globalContext);
    } else {
      throw new Error('Failed to create EDR deployment');
    }
  };

  const handleCheckDbtFiles = async (firstTimeSetup: boolean) => {
    setLoading(true);
    try {
      const gitPullResponse: { success: boolean } = await httpPost(session, 'dbt/git_pull/', {});
      if (!gitPullResponse.success) {
        errorToast('Something went wrong running git-pull', [], globalContext);
      }
      // first will be git pull, which pulls the latest changes and then the dbt files are checked.
      const checkDbtFilesResponse: ElementaryStatus = await httpGet(session, 'dbt/check-dbt-files');
      setElementaryStatus(checkDbtFilesResponse);
      const needsUpgrade = checkDbtFilesResponse?.exists?.elementary_package?.needs_upgrade;

      // Check for upgrade requirement and set message
      if (needsUpgrade) {
        setUpgradeMessage(
          `Please update the version of "elementary-data/elementary" in your packages.yml to ${needsUpgrade} and click the button when done`
        );
      }
      if (firstTimeSetup && Object.keys(checkDbtFilesResponse?.missing).length === 0) {
        // Wait for all API calls including polling to complete before setting loading to false
        // git pull

        await createElementaryProfile();
        await createElementaryTrackingTables();
        await createEdrDeployment();
        setShowSetupElementaryButtom(false);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const gitPullAndMigrateElementaryTrackingTables = async () => {
    setUpgradeInProgress(true);
    try {
      const gitPullResponse: any = await httpPost(session, 'dbt/git_pull/', {});
      if (!gitPullResponse.success) {
        errorToast('Something went wrong running git-pull', [], globalContext);
        return;
      }

      // and then call
      await createElementaryTrackingTables();
      // once this is done we show
      // "upgrade successfull, please regenerate the report at your convenience"
      setUpgradeMessage('Upgrade successful, please regenerate the report at your convenience');
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setUpgradeInProgress(false);
    }
  };

  if (dbtStatus) {
    return (
      <>
        <Box
          data-testid="outerbox"
          sx={{
            width: '100%',
            pt: 3,
            pr: 3,
            pl: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '20vh',
              textAlign: 'center',
              backgroundColor: 'white',
              borderRadius: '10px',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '20px', sm: '25px', md: '30px' },
                fontWeight: 400,
              }}
            >
              {dbtStatus}
            </Typography>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box data-testid="outerbox" sx={{ width: '100%', pt: 3, pr: 3, pl: 3 }}>
        {/* Upgrade Message Section */}
        {upgradeMessage && (
          <Card sx={{ mb: 2, backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: '#856404', fontWeight: 500 }}>
                    {upgradeMessage}
                  </Typography>
                </Box>
                {upgradeMessage.includes('click the button when done') && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={gitPullAndMigrateElementaryTrackingTables}
                    disabled={upgradeInProgress}
                    sx={{ ml: 2, minWidth: '120px' }}
                  >
                    {upgradeInProgress ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        Upgrading...
                      </>
                    ) : (
                      'Complete Upgrade'
                    )}
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() => setUpgradeMessage('')}
                  sx={{ ml: 1, minWidth: 'auto', color: '#856404' }}
                >
                  ✕
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {showSetupElementaryButtom ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2rem',
              mt: 3,
            }}
          >
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography sx={{ fontSize: '25px ' }}>
                  You currently dont have elementary setup. Please click the button below to setup
                  elementary.
                </Typography>
                <Button onClick={() => handleCheckDbtFiles(true)} variant="contained">
                  Setup Elementary
                </Button>
              </>
            )}

            <MappingComponent elementaryStatus={elementaryStatus} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                mb: 1,
              }}
            >
              {elementaryToken && (
                <Typography variant="h6">
                  <strong> Last generated:</strong> {generatedAt}
                </Typography>
              )}

              <Button
                sx={{ ml: 'auto' }}
                onClick={() => refreshReport()}
                disabled={generateReportLock}
                variant="contained"
              >
                {generateReportLock ? (
                  <>
                    <Image
                      src={SyncIcon}
                      className={styles.SyncIcon}
                      alt="sync icon"
                      style={{ marginRight: '4px' }}
                      data-testid="sync-icon"
                    />
                    Generating report
                  </>
                ) : (
                  ' Regenerate report'
                )}
              </Button>
            </Box>
            <Card
              sx={{
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '8px',
                height: '100%',
                width: '100%',
                padding: '1rem',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <CircularProgress />
              ) : elementaryToken ? (
                <Box width="100%" height="calc(100vh - 210px)" sx={{ flexGrow: 1 }}>
                  <iframe
                    src={backendUrl + `/elementary/${elementaryToken}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                  ></iframe>
                </Box>
              ) : (
                <Typography variant="h6">
                  No report available. Please click on the button above to generate if you believe a
                  report should be available.
                </Typography>
              )}
            </Card>
          </>
        )}
      </Box>
    </>
  );
};
