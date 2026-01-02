import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Dbt from '@/assets/images/dbt.png';

interface DBTRepositoryCardProps {
  onConnectGit?: () => void; // Made optional since we handle internally now
}

const DBTRepositoryCard: React.FC<DBTRepositoryCardProps> = ({ onConnectGit }) => {
  const [gitRepoInfo, setGitRepoInfo] = useState({
    url: '',
    defaultSchema: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    gitrepoUrl: '',
    gitrepoAccessToken: '',
    defaultSchema: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions.state || [];

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
          setFormData({
            gitrepoUrl: response.gitrepo_url,
            gitrepoAccessToken: response.gitrepo_access_token ? '*********' : '',
            defaultSchema: response.default_schema || '',
          });
        } else {
          // Connect mode: only prefill schema from workspace, leave git fields empty
          setFormData({
            gitrepoUrl: '',
            gitrepoAccessToken: '',
            defaultSchema: response.default_schema || '',
          });
        }
      } else {
        // No workspace data available, reset form completely
        setFormData({
          gitrepoUrl: '',
          gitrepoAccessToken: '',
          defaultSchema: '',
        });
      }
      setErrors({});
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.gitrepoUrl.trim()) {
      newErrors.gitrepoUrl = 'Repository URL is required';
    } else if (!isValidGitHubUrl(formData.gitrepoUrl)) {
      newErrors.gitrepoUrl = 'Please enter a valid GitHub repository URL';
    }

    if (!formData.gitrepoAccessToken.trim()) {
      newErrors.gitrepoAccessToken = 'Personal Access Token is required';
    }

    if (!formData.defaultSchema.trim()) {
      newErrors.defaultSchema = 'Default schema is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidGitHubUrl = (url: string): boolean => {
    const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
    return githubUrlPattern.test(url);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const currentWorkspace = await getCurrentWorkspaceData();
      const schemaChanged = currentWorkspace?.default_schema !== formData.defaultSchema;
      const gitRepoChanged =
        currentWorkspace?.gitrepo_url !== formData.gitrepoUrl ||
        (formData.gitrepoAccessToken && formData.gitrepoAccessToken !== '*********');

      // If only schema changed, use schema endpoint
      if (schemaChanged && !gitRepoChanged) {
        await httpPut(session, 'dbt/v1/schema/', {
          target_configs_schema: formData.defaultSchema,
        });
        successToast('Schema updated successfully!', [], globalContext);
      }
      // If git repo changed (or both changed), use connect_git_remote endpoint
      else if (gitRepoChanged) {
        await httpPut(session, 'dbt/connect_git_remote/', {
          gitrepoUrl: formData.gitrepoUrl,
          gitrepoAccessToken: formData.gitrepoAccessToken,
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
            target_configs_schema: formData.defaultSchema,
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
    setFormData({
      gitrepoUrl: '',
      gitrepoAccessToken: '',
      defaultSchema: '',
    });
    setErrors({});
    setShowDialog(false);
  };

  const handleButtonClick = () => {
    setShowDialog(true);
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
      <Dialog
        open={showDialog}
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle>
          <Typography variant="h6">
            {isConnected ? 'Edit GitHub Connection' : 'Connect to GitHub'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
            <Alert severity="info" icon={false} sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ textAlign: 'left' }}>
                {isConnected
                  ? 'Update your GitHub repository connection settings.'
                  : 'Connect your GitHub repository to sync your DBT models and enable version control.'}
              </Typography>
            </Alert>

            <TextField
              label="GitHub Repository URL"
              placeholder="https://github.com/username/repository-name"
              value={formData.gitrepoUrl}
              onChange={handleInputChange('gitrepoUrl')}
              error={!!errors.gitrepoUrl}
              helperText={errors.gitrepoUrl || 'Enter the full URL of your GitHub repository'}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Personal Access Token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={formData.gitrepoAccessToken}
              onChange={handleInputChange('gitrepoAccessToken')}
              error={!!errors.gitrepoAccessToken}
              helperText={
                errors.gitrepoAccessToken ||
                'GitHub Personal Access Token with repository permissions'
              }
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Default Schema"
              placeholder="e.g., intermediate, staging, marts"
              value={formData.defaultSchema}
              onChange={handleInputChange('defaultSchema')}
              error={!!errors.defaultSchema}
              helperText={errors.defaultSchema || 'Default schema for DBT models'}
              fullWidth
              variant="outlined"
            />

            <Alert severity="warning">
              <Typography variant="body2">
                Make sure your Personal Access Token has the following permissions:
                <strong> repo, workflow</strong>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? 'Connecting...' : isConnected ? 'Update' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DBTRepositoryCard;
