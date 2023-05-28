import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useState, useContext, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';
import { Close } from '@mui/icons-material';
import CustomDialog from '../Dialog/CustomDialog';

interface DBTSetupProps {
  onCreateWorkspace: (...args: any) => any;
  logs: Array<any>;
  setLogs: (...args: any) => any;
  setExpandLogs: (...args: any) => any;
  showDialog: boolean;
  setShowDialog: (...args: any) => any;
}

export const DBTSetup = ({
  onCreateWorkspace,
  logs,
  setLogs,
  setExpandLogs,
  showDialog,
  setShowDialog,
}: DBTSetupProps) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { gitrepoUrl: '', gitrepoAccessToken: '', schema: '' },
  });
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState<any[]>([]);
  const [setupStatus, setSetupStatus] = useState('not-started');
  const [failureMessage, setFailureMessage] = useState(null);
  const toastContext = useContext(GlobalContext);

  const checkProgress = async function (taskId: string) {
    try {
      const message = await httpGet(session, `tasks/${taskId}`);
      setProgressMessages(message['progress']);

      const lastMessage = message['progress'][message['progress'].length - 1];

      if (lastMessage['status'] === 'completed') {
        setSetupStatus('completed');
      } else if (lastMessage['status'] === 'failed') {
        setSetupStatus('failed');
        setFailureMessage(lastMessage['message']);
      } else {
        setTimeout(() => {
          checkProgress(taskId);
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  useEffect(() => {
    setLogs(
      progressMessages.map(
        (msg) => `${msg.stepnum ? msg.stepnum + '. ' : ''}${msg.message}`
      )
    );
  }, [progressMessages]);

  useEffect(() => {
    const progressMsgs = [];
    if (setupStatus === 'started')
      progressMsgs.push({ stepnum: '', message: 'Setting up workspace...' });

    if (setupStatus === 'completed') {
      onCreateWorkspace();
      progressMsgs.push({ stepnum: '', message: 'Setup completed' });
    }

    if (setupStatus === 'failed')
      progressMsgs.push({
        stepnum: '',
        message: `Setup failed: ${failureMessage}`,
      });

    setProgressMessages(progressMessages.concat(progressMsgs));
  }, [setupStatus]);

  const onSubmit = async (data: any) => {
    setSetupStatus('started');
    handleClose();
    setExpandLogs(true);

    const payload = {
      gitrepoUrl: data.gitrepoUrl,
      dbtVersion: '1.4.5',
      profile: {
        name: 'dbt',
        target: 'dev',
        target_configs_schema: data.schema,
      },
    } as any;
    if (data.gitrepoAccessToken) {
      payload.gitrepoAccessToken = data.gitrepoAccessToken;
    }

    try {
      const message = await httpPost(session, 'dbt/workspace/', payload);
      setTimeout(() => {
        checkProgress(message.task_id);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
      setSetupStatus('failed');
    }
  };

  const handleClose = () => {
    reset();
    setShowDialog(false);
  };

  const AddWorkspaceSetupForm = () => {
    return (
      <>
        <Box>
          <TextField
            sx={{ width: '100%' }}
            data-testid="github-url"
            label="GitHub repo URL"
            variant="outlined"
            {...register('gitrepoUrl', { required: true })}
          />
        </Box>
        <Box sx={{ m: 2 }} />
        <Box>
          <TextField
            sx={{ width: '100%' }}
            data-testid="github-pat"
            label="Personal access token"
            variant="outlined"
            {...register('gitrepoAccessToken', { required: false })}
          />
        </Box>
        <Box sx={{ m: 2 }} />
        <Box>
          <TextField
            sx={{ width: '100%' }}
            data-testid="dbt-target-schema"
            label="dbt target schema"
            variant="outlined"
            {...register('schema', { required: true })}
          />
        </Box>
        <Box sx={{ m: 2 }} />
      </>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Conect Repo'}
        show={showDialog}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        formContent={<AddWorkspaceSetupForm />}
        formActions={
          <>
            <Button
              variant="contained"
              type="submit"
              data-testid="save-github-url"
            >
              Save
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancel"
            >
              Cancel
            </Button>
          </>
        }
      ></CustomDialog>
    </>
  );
};
