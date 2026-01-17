import React, { useContext, useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Link, Alert, CircularProgress } from '@mui/material';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import CustomDialog from '../Dialog/CustomDialog';
import Input from '../UI/Input/Input';
import Dbt from '@/assets/images/dbt.png';

interface DBTRepositoryCardProps {
  onConnectGit?: () => void; // Made optional since we handle internally now
}

interface DBTFormData {
  gitrepoUrl: string;
  gitrepoAccessToken: string;
  defaultSchema: string;
}

const DBTRepositoryCard: React.FC<DBTRepositoryCardProps> = ({ onConnectGit }) => {
  const [gitRepoInfo, setGitRepoInfo] = useState({
    url: '',
    defaultSchema: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<DBTFormData>();

  const fetchDbtWorkspace = async () => {
    if (!session) return;

    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');

      if (response && !response.error) {
        // Workspace exists, but git repo might not be connected
        const hasGitRepo = !!response.gitrepo_url;
        setGitRepoInfo({
          url: response.gitrepo_url || '',
          defaultSchema: response.default_schema || '',
        });
        setIsConnected(hasGitRepo);
      } else {
        // No workspace configured or error
        setGitRepoInfo({
          url: '',
          defaultSchema: '',
        });
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error fetching dbt workspace:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session]);

  const getButtonText = () => {
    if (isConnected) {
      return 'Edit';
    }
    return 'Connect to Github';
  };

  const isButtonDisabled = () => {
    if (isConnected) {
      return !permissions.includes('can_edit_dbt_workspace');
    }
    return !permissions.includes('can_create_dbt_workspace');
  };

  // Dialog functionality
  useEffect(() => {
    if (showDialog && session) {
      fetchWorkspaceDataForForm();
    }
  }, [showDialog, session]);

  const fetchWorkspaceDataForForm = async () => {
    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');

      if (response && !response.error) {
        if (isConnected && response.gitrepo_url) {
          // Edit mode: prefill all fields
          setValue('gitrepoUrl', response.gitrepo_url);
          setValue('gitrepoAccessToken', response.gitrepo_access_token ? '*********' : '');
          setValue('defaultSchema', response.default_schema || '');
        } else {
          // Connect mode: only prefill schema from workspace, leave git fields empty
          setValue('gitrepoUrl', '');
          setValue('gitrepoAccessToken', '');
          setValue('defaultSchema', response.default_schema || '');
        }
      } else {
        // No workspace data available, reset form completely
        setValue('gitrepoUrl', '');
        setValue('gitrepoAccessToken', '');
        setValue('defaultSchema', '');
      }
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    }
  };

  const isValidGitHubUrl = (url: string): boolean => {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const onSubmit = async (data: DBTFormData) => {
    setLoading(true);
    try {
      const currentWorkspace = await getCurrentWorkspaceData();
      const schemaChanged = currentWorkspace?.default_schema !== data.defaultSchema;
      const gitRepoChanged =
        currentWorkspace?.gitrepo_url !== data.gitrepoUrl ||
        (data.gitrepoAccessToken && data.gitrepoAccessToken !== '*********');

      // If only schema changed, use schema endpoint
      if (schemaChanged && !gitRepoChanged) {
        await httpPut(session, 'dbt/v1/schema/', {
          target_configs_schema: data.defaultSchema,
        });
        successToast('Schema updated successfully!', [], globalContext);
      }
      // If git repo changed (or both changed), use connect_git_remote endpoint
      else if (gitRepoChanged) {
        await httpPut(session, 'dbt/connect_git_remote/', {
          gitrepoUrl: data.gitrepoUrl,
          gitrepoAccessToken: data.gitrepoAccessToken,
        });
        successToast(
          isConnected
            ? 'GitHub repository updated successfully!'
            : 'GitHub repository connected successfully!',
          [],
          globalContext
        );

        // If schema also changed, update it separately after git repo update
        if (schemaChanged) {
          await httpPut(session, 'dbt/v1/schema/', {
            target_configs_schema: data.defaultSchema,
          });
        }
      } else {
        // No changes detected
        successToast('No changes to save', [], globalContext);
      }

      handleDialogClose();
      await fetchDbtWorkspace(); // Refresh the card data
      onConnectGit?.(); // Call the callback if provided
    } catch (error: any) {
      console.error('Error updating repository/schema:', error);
      errorToast(error?.message || 'Failed to update repository/schema', [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWorkspaceData = async () => {
    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');
      return response && !response.error ? response : null;
    } catch (error) {
      console.error('Error fetching current workspace data:', error);
      return null;
    }
  };

  const handleDialogClose = () => {
    reset();
    setShowDialog(false);
  };

  const handleButtonClick = () => {
    setShowDialog(true);
  };

  const GitConnectionForm = () => {
    return (
      <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
        <Input
          label="GitHub repo URL"
          placeholder="https://github.com/username/repository-name"
          register={register}
          name="gitrepoUrl"
          required
          error={!!errors.gitrepoUrl}
          helperText={errors.gitrepoUrl?.message}
          fullWidth
        />

        <Input
          label="Personal access token"
          data-testid="github-pat"
          type="password"
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          register={register}
          name="gitrepoAccessToken"
          required
          error={!!errors.gitrepoAccessToken}
          helperText={errors.gitrepoAccessToken?.message}
          fullWidth
        />

        <Input
          label="Dbt default Schema"
          placeholder="e.g., intermediate, staging, marts"
          register={register}
          name="defaultSchema"
          required
          error={!!errors.defaultSchema}
          helperText={errors.defaultSchema?.message}
          fullWidth
        />

        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Make sure your Personal Access Token has the following permissions:
            <strong> repo, workflow</strong>
          </Typography>
        </Alert>
      </Box>
    );
  };

  return (
    <>
      <Card
        sx={{
          background: 'white',
          display: 'flex',
          borderRadius: '8px',
          padding: '16px',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          border: 'none',
          boxShadow: 'none',
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
          <Image src={Dbt} alt="DBT Logo" style={{ width: '46px', height: '46px' }} />
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
            }}
          >
            <Typography sx={{ fontWeight: 700 }} variant="h4" color="#000">
              DBT REPOSITORY
            </Typography>
            {isConnected ? (
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
                  href={gitRepoInfo.url || '#'}
                >
                  <Typography sx={{ fontWeight: 600, color: '#0F2440' }}>
                    {gitRepoInfo.url}
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
                  <Typography sx={{ fontWeight: 600, color: '#0F2440' }}>
                    {gitRepoInfo.defaultSchema}
                  </Typography>
                </Box>
              </>
            ) : (
              <Typography variant="body1" color="#808080">
                Connect to Github to push your changes to main
              </Typography>
            )}
          </Box>
        </Box>
        <Box>
          <Button variant="contained" onClick={handleButtonClick} disabled={isButtonDisabled()}>
            {getButtonText()}
          </Button>
        </Box>
      </Card>

      {/* Git Connection Dialog */}
      <CustomDialog
        title={isConnected ? 'Edit GitHub Connection' : 'Connect to GitHub'}
        show={showDialog}
        handleClose={handleDialogClose}
        handleSubmit={handleSubmit(onSubmit)}
        loading={loading}
        maxWidth="sm"
        fullWidth
        formContent={<GitConnectionForm />}
        formActions={
          <Box display="flex" flexDirection="column" gap={2} sx={{ width: '100%' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : undefined}
              data-testid="save-github-url"
              fullWidth
            >
              Save & Connect
            </Button>
            <Button
              onClick={handleDialogClose}
              disabled={loading}
              data-testid="cancel"
              variant="outlined"
              fullWidth
            >
              Cancel
            </Button>
          </Box>
        }
      />
    </>
  );
};

export default DBTRepositoryCard;
