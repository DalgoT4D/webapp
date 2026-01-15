import React, { useState, useContext } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { httpPut } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import CustomDialog from '../../../Dialog/CustomDialog';
import Input from '../../../UI/Input/Input';

interface PatRequiredModalProps {
  open: boolean;
  onClose: () => void;
  onAddKey: () => void;
  onViewOnly: () => void;
  gitRepoUrl: string;
}

interface PatFormData {
  gitrepoAccessToken: string;
}

const PatRequiredModal: React.FC<PatRequiredModalProps> = ({
  open,
  onClose,
  onAddKey,
  onViewOnly,
  gitRepoUrl,
}) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PatFormData>();

  const onSubmit = async (data: PatFormData) => {
    setLoading(true);
    try {
      await httpPut(session, 'dbt/connect_git_remote/', {
        gitrepoUrl: gitRepoUrl,
        gitrepoAccessToken: data.gitrepoAccessToken,
      });

      successToast('Personal Access Token added successfully', [], globalContext);
      reset();
      onAddKey();
      onClose();
    } catch (error: any) {
      console.error('Error adding PAT:', error);
      errorToast(error.message || 'Failed to add Personal Access Token', [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnly = () => {
    reset();
    onViewOnly();
    onClose();
  };

  const PatForm = () => {
    return (
      <Box display="flex" flexDirection="column" gap={3} sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Add your Personal Access Token to make changes to this workspace. You can view the canvas
          without authentication, but you&apos;ll need a Personal Access Token to make changes or
          publish to Git.
        </Typography>

        <Box>
          <Input label="GitHub repo URL" value={gitRepoUrl} disabled fullWidth />
        </Box>

        <Box>
          <Input
            label="Personal Access Token"
            type="password"
            register={register}
            name="gitrepoAccessToken"
            required
            placeholder="Enter your GitHub Personal Access Token"
            disabled={loading}
            autoFocus
            fullWidth
            error={!!errors.gitrepoAccessToken}
            helperText={errors.gitrepoAccessToken?.message}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, mb: 2, display: 'block' }}
          >
            Need a token?{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer">
              Create one on GitHub
            </a>
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <CustomDialog
      title="Git Authentication Required"
      show={open}
      handleClose={handleViewOnly}
      handleSubmit={handleSubmit(onSubmit)}
      loading={loading}
      maxWidth="sm"
      fullWidth
      formContent={<PatForm />}
      formActions={
        <Box display="flex" flexDirection="column" gap={2} sx={{ width: '100%' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{
              backgroundColor: '#00897B',
              '&:hover': {
                backgroundColor: '#00695C',
              },
            }}
          >
            Connect
          </Button>
          <Button onClick={handleViewOnly} disabled={loading} variant="outlined" fullWidth>
            Proceed without token
          </Button>
        </Box>
      }
    />
  );
};

export default PatRequiredModal;
