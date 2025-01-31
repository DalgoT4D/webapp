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
    elementary_package?: string;
    elementary_target_schema?: string;
  };
  missing: {
    elementary_package?: string;
    elementary_target_schema?: string;
  };
};

// Function to check if an object is empty
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
        height: '70vh',
        margin: 'auto',
        mt: 3,
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
      }}
    >
      {hasExists && (
        <Card sx={{ flex: 0.5, maxHeight: '60vh', overflowY: 'auto' }} variant="outlined">
          {' '}
          {/* Scroll inside the Card */}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Existing Items
            </Typography>
            <List>
              {Object.entries(elementaryStatus.exists).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText primary={key} secondary={value} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {hasMissing && (
        <Card sx={{ flex: 1, maxHeight: '60vh', overflowY: 'auto' }} variant="outlined">
          {' '}
          {/* Scroll inside the Card */}
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Missing Items
            </Typography>
            <List>
              {Object.entries(elementaryStatus.missing).map(([key, value]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key}
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

  useEffect(() => {
    if (session) {
      (async () => {
        try {
          const response = await httpGet(session, `dbt/elementary-setup-status`);
          if (response.status == 'set-up') {
            fetchElementaryToken();
            checkForLock();
          } else if (response.status == 'not-set-up') {
            //setup elementary button
            setShowSetupElementaryButtom(true);
          }
        } catch (err: any) {
          if ((err.message = 'dbt is not configured for this client')) {
            setDbtStatus('dbt is not configured for this client');
          }
          errorToast(err.message, [], globalContext);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [session]);

  const createElementaryProfile = async () => {
    try {
      const response = await httpPost(session, `prefect/tasks/elementary-lock/`, {});
      if (response.status && response.status == 'success') {
        successToast('Elementary profile created successfully', [], globalContext);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }
  };
  const createElementaryTrackingTables = async () => {
    try {
      const response = await httpPost(session, `/create-elementary-tracking-tables/`, {});
      if (response.status && response.status == 'success') {
        successToast('Elementary Tracking Tables created successfully', [], globalContext);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }
  };
  const createEdrDeployment = async () => {
    try {
      const response = await httpPost(session, `/create-edr-deployment/`, {});
      if (response.status && response.status == 'success') {
        successToast('Edr deployment created successfully', [], globalContext);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }
  };

  const handleCheckDbtFiles = async () => {
    setLoading(true);
    try {
      const response: ElementaryStatus = await httpGet(session, 'dbt/check-dbt-files');
      setElementaryStatus(response);

      if (Object.keys(response.missing).length === 0) {
        //call apis
        createElementaryProfile();
        createElementaryTrackingTables();
        createEdrDeployment();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  if (dbtStatus) {
    return (
      <>
        <Box data-testid="outerbox" sx={{ width: '100%', pt: 3, pr: 3, pl: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: 'calc(100vh - 210px)',
            }}
          >
            <Typography sx={{ fontSize: '25px' }}>{dbtStatus}</Typography>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box data-testid="outerbox" sx={{ width: '100%', pt: 3, pr: 3, pl: 3 }}>
        {showSetupElementaryButtom ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: 'calc(100vh - 210px)',
              gap: '2rem',
              mt: 3,
            }}
          >
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <Typography sx={{ fontSize: '25px ' }}>
                  `You currently dont have elementary setup. Please click the button below to setup
                  elementary.
                </Typography>
                <Button onClick={handleCheckDbtFiles} variant="contained">
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
