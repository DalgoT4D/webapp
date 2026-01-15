import React, { useContext, useEffect, useState } from 'react';
import { PageHead } from '@/components/PageHead';
import { httpGet, httpPost, httpDelete, httpPut } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import { Box, Typography, Button, Tabs, Tab } from '@mui/material';
import { useSession } from 'next-auth/react';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import UITransformTab from '@/components/DBT/UITransformTab';
import DBTTransformTab from '@/components/DBT/DBTTransformTab';
import useSWR from 'swr';

export type TransformType = 'github' | 'ui' | 'none' | 'dbtcloud' | null;

interface TransformTypeResponse {
  transform_type: TransformType;
}

export const fetchTransformType = async (session: any) => {
  try {
    const { transform_type } = await httpGet(session, 'dbt/dbt_transform/');

    return { transform_type: transform_type as TransformType };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`transform-tabpanel-${index}`}
      aria-labelledby={`transform-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `transform-tab-${index}`,
    'aria-controls': `transform-tabpanel-${index}`,
  };
}

const Transform = () => {
  const [workspaceSetup, setWorkspaceSetup] = useState<boolean>(false);
  const [setupLoading, setSetupLoading] = useState<boolean>(false);
  const [setupError, setSetupError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [gitConnected, setGitConnected] = useState<boolean>(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const { data: preferences, mutate: mutateUserPreferences } = useSWR(`userpreferences/`);

  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // Save the tab preference
    const transformTabValue = newValue === 0 ? 'ui' : 'github';
    try {
      await httpPut(session, 'userpreferences/', {
        last_visited_transform_tab: transformTabValue,
      });
      // Update the local SWR cache
      mutateUserPreferences();
    } catch (error) {
      console.error('Error saving tab preference:', error);
      // Don't show error to user as this is a non-critical feature
    }
  };

  const checkGitConnection = async () => {
    try {
      setGitConnected(true); // TODO: API_BINDING - Set to true for demo/testing
    } catch (error) {
      console.error('Error checking git connection:', error);
      setGitConnected(false);
    }
  };

  // Load saved tab preference when preferences are fetched
  useEffect(() => {
    if (preferences && preferences.res && !preferencesLoaded) {
      const savedTab = preferences.res.last_visited_transform_tab;
      if (savedTab === 'ui') {
        setActiveTab(0);
      } else if (savedTab === 'github') {
        setActiveTab(1);
      }
      // If savedTab is null/undefined, keep default (0)
      setPreferencesLoaded(true);
    }
  }, [preferences, preferencesLoaded]);

  useEffect(() => {
    if (session) {
      // Check if dbt workspace exists
      // TODO: API_BINDING - Replace with new unified workspace check endpoint
      fetchTransformType(session)
        .then((response: TransformTypeResponse) => {
          const transformType = response.transform_type;
          if (
            transformType === 'ui' ||
            transformType === 'github' ||
            transformType === 'dbtcloud'
          ) {
            setWorkspaceSetup(true);
            // TODO: API_BINDING - Check if git repository is connected
            checkGitConnection();
          } else {
            // Auto-setup unified workspace for new users
            setupUnifiedWorkspace();
          }
        })
        .catch((error) => {
          console.error('Error fetching transform type:', error);
          // If no workspace exists, setup unified workspace
          setupUnifiedWorkspace();
        });
    }
  }, [session]);

  const setupUnifiedWorkspace = async () => {
    setSetupLoading(true);
    setSetupError(''); // Clear any previous errors
    try {
      // Setup local project for unified experience
      await httpPost(session, 'transform/dbt_project/', {
        default_schema: 'intermediate',
      });

      // Create system transform tasks
      await httpPost(session, `prefect/tasks/transform/`, {});

      // Hit sync sources api
      await httpPost(session, `transform/dbt_project/sync_sources/`, {});

      setWorkspaceSetup(true);
    } catch (err: any) {
      console.error('Error occurred while setting up unified workspace:', err);

      // Set error message to display to user
      let errorMessage = 'Failed to set up transform workspace. Please try again.';
      if (err.cause?.detail) {
        errorMessage = err.cause.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setSetupError(errorMessage);

      // Try to cleanup - if it fails, ignore
      try {
        await httpDelete(session, 'transform/dbt_project/dbtrepo');
      } catch (cleanupError) {
        // Ignore cleanup errors
        console.warn('Cleanup failed (workspace might not exist):', cleanupError);
      }

      // Keep workspace setup as false - user shouldn't see interface until setup completes
      setWorkspaceSetup(false);
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | Transform" />
      <main className={styles.main}>
        {setupLoading ? (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Typography variant="h6" color="#808080">
              Setting up your unified transform workspace...
            </Typography>
            {/* TODO: Add loading spinner component */}
          </Box>
        ) : setupError ? (
          <Box>
            <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
              Transform
            </Typography>
            <Box display="flex" flexDirection="column" alignItems="center" gap={3} sx={{ mt: 4 }}>
              <Typography variant="h6" color="error" textAlign="center">
                Setup Failed
              </Typography>
              <Typography variant="body1" color="#808080" textAlign="center" sx={{ maxWidth: 500 }}>
                {setupError}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={setupUnifiedWorkspace}
                disabled={setupLoading}
              >
                Try Again
              </Button>
            </Box>
          </Box>
        ) : workspaceSetup ? (
          <Box>
            <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
              Transform
            </Typography>

            {/* Tab Navigation */}
            <Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                aria-label="transform tabs"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none', // Prevents Material-UI from making tabs uppercase
                  },
                }}
              >
                <Tab label="UI Transform" {...a11yProps(0)} />
                <Tab label="DBT Transform" {...a11yProps(1)} />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={activeTab} index={0}>
              <UITransformTab
                onGitConnected={() => setGitConnected(true)}
                gitConnected={gitConnected}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <DBTTransformTab
                gitConnected={gitConnected}
                onConnectGit={() => setGitConnected(true)}
              />
            </TabPanel>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Typography variant="h6" color="#808080">
              Preparing your transform workspace...
            </Typography>
          </Box>
        )}
      </main>
    </>
  );
};

export default Transform;
