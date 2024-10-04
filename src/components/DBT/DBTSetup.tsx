import { Box, Button } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useState, useContext, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import CustomDialog from '../Dialog/CustomDialog';
import Input from '../UI/Input/Input';
import { delay } from '@/utils/common';

interface DBTSetupProps {
  onCreateWorkspace: (...args: any) => any;
  setLogs: (...args: any) => any;
  setExpandLogs: (...args: any) => any;
  showDialog: boolean;
  setShowDialog: (...args: any) => any;
  gitrepoUrl: string;
  schema: string;
  mode: string;
  setWorkspace: (...args: any) => any;
}

interface DBTCreateWorkspaceParams {
  gitrepoUrl: string;
  gitrepoAccessToken: string;
  schema: string;
}

export const DBTSetup = ({
  onCreateWorkspace,
  setLogs,
  setExpandLogs,
  showDialog,
  setShowDialog,
  gitrepoUrl,
  schema,
  mode,
  setWorkspace,
}: DBTSetupProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DBTCreateWorkspaceParams>();
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState<any[]>([]);
  const [setupStatus, setSetupStatus] = useState('not-started');
  const [failureMessage, setFailureMessage] = useState(null);
  const toastContext = useContext(GlobalContext);

  const checkProgress = async function (taskId: string, hashKeyPrefix: string) {
    try {
      const orgSlug = toastContext?.CurrentOrg.state.slug;
      const hashKey = `${hashKeyPrefix}-${orgSlug}`;
      const message = await httpGet(session, `tasks/${taskId}?hashkey=${hashKey}`);
      setProgressMessages(message['progress']);

      const lastMessage = message['progress'][message['progress'].length - 1];

      if (lastMessage['status'] === 'completed') {
        setSetupStatus('completed');
      } else if (lastMessage['status'] === 'failed') {
        setSetupStatus('failed');
        setFailureMessage(lastMessage['message']);
      } else {
        await delay(2000);
        checkProgress(taskId, hashKeyPrefix);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  useEffect(() => {
    setLogs(
      progressMessages.map((msg) => `${msg.stepnum ? msg.stepnum + '. ' : ''}${msg.message}`)
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

  const onSubmit = async (data: DBTCreateWorkspaceParams) => {
    handleClose();

    if (mode === 'create') {
      setSetupStatus('started');
      createWorkspace(data);
    } else {
      editWorkspace(data);
    }
  };

  const createWorkspace = async (data: DBTCreateWorkspaceParams) => {
    const payload = {
      gitrepoUrl: data.gitrepoUrl,
      dbtVersion: '1.4.5',
      profile: {
        name: 'dbt',
        target_configs_schema: data.schema,
      },
    } as any;

    if (data.gitrepoAccessToken) {
      payload.gitrepoAccessToken = data.gitrepoAccessToken;
    }

    setExpandLogs(true);

    try {
      const message = await httpPost(session, 'dbt/workspace/', payload);
      await delay(1000);
      checkProgress(message.task_id, 'setup-dbt-workspace');
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
      setSetupStatus('failed');
    }
  };

  const editWorkspace = async (data: DBTCreateWorkspaceParams) => {
    if (data.schema && data.schema !== schema) {
      const updateSchemaPayload = {
        target_configs_schema: data.schema,
      };
      try {
        await httpPut(session, 'dbt/v1/schema/', updateSchemaPayload);
        setWorkspace({
          gitrepo_url: gitrepoUrl,
          default_schema: data.schema,
        });
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
        setSetupStatus('failed');
        return;
      }
    }
    if (data.gitrepoUrl) {
      if (data.gitrepoUrl === gitrepoUrl && !data.gitrepoAccessToken) {
        return;
      }
      const updateGitPayload = {
        gitrepoUrl: data.gitrepoUrl,
        gitrepoAccessToken: data.gitrepoAccessToken,
      };
      setExpandLogs(true);
      try {
        const message = await httpPut(session, 'dbt/github/', updateGitPayload);
        setWorkspace({
          gitrepo_url: data.gitrepoUrl,
          default_schema: data.schema,
        });
        await delay(1000);

        checkProgress(message.task_id, 'clone-github-repo');
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
        setSetupStatus('failed');
      }
    } else {
      setSetupStatus('completed');
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
          <Input
            sx={{ width: '100%' }}
            data-testid="github-url"
            label="GitHub repo URL"
            variant="outlined"
            defaultValue={gitrepoUrl}
            register={register}
            name="gitrepoUrl"
            required
            error={!!errors.gitrepoUrl}
            helperText={errors.gitrepoUrl?.message}
          />
        </Box>
        <Box sx={{ m: 2 }} />
        <Box>
          <Input
            sx={{ width: '100%' }}
            data-testid="github-pat"
            label="Personal access token"
            variant="outlined"
            register={register}
            name="gitrepoAccessToken"
            error={!!errors.gitrepoAccessToken}
            helperText={errors.gitrepoAccessToken?.message}
          />
        </Box>
        <Box sx={{ m: 2 }} />
        <Box>
          <Input
            sx={{ width: '100%' }}
            data-testid="dbt-target-schema"
            label="dbt target schema"
            variant="outlined"
            defaultValue={schema}
            register={register}
            name="schema"
            required
            error={!!errors.schema}
            helperText={errors.schema?.message}
          />
        </Box>
        <Box sx={{ m: 2 }} />
      </>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Connect to DBT repository'}
        show={showDialog}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<AddWorkspaceSetupForm />}
        formActions={
          <>
            <Button variant="contained" type="submit" data-testid="save-github-url">
              Save
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose} data-testid="cancel">
              Cancel
            </Button>
          </>
        }
      ></CustomDialog>
    </>
  );
};
