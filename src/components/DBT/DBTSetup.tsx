import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState, useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';

export const DBTSetup = ({ onCreateWorkspace }: any) => {

  const { register, handleSubmit } = useForm({ defaultValues: { gitrepoUrl: '', gitrepoAccessToken: '', schema: '' } });
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState<any[]>([]);
  const [setupStatus, setSetupStatus] = useState("not-started");
  const [failureMessage, setFailureMessage] = useState(null);
  const toastContext = useContext(GlobalContext);

  const checkProgress = async function (taskId: string) {

    try {
      const message = await httpGet(session, `tasks/${taskId}`);
      setProgressMessages(message['progress']);

      const lastMessage = message['progress'][message['progress'].length - 1];

      if (lastMessage['status'] === 'completed') {
        setSetupStatus("completed");

      } else if (lastMessage['status'] === 'failed') {
        setSetupStatus("failed");
        setFailureMessage(lastMessage['message']);

      } else {
        setTimeout(() => { checkProgress(taskId) }, 2000);
      }
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    };

  }

  const onSubmit = async (data: any) => {

    setSetupStatus("started");

    const payload = {
      gitrepoUrl: data.gitrepoUrl,
      dbtVersion: "1.4.5",
      profile: {
        name: 'dbt',
        target: 'dev',
        target_configs_schema: data.schema,
      }
    } as any;
    if (data.gitrepoAccessToken) {
      payload.gitrepoAccessToken = data.gitrepoAccessToken;
    }

    try {
      const message = await httpPost(session, 'dbt/workspace/', payload);
      setTimeout(() => { checkProgress(message.task_id) }, 1000);
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
      setSetupStatus("failed");
    };
  };

  return (
    <>
      {
        setupStatus === 'not-started' &&

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box className={styles.Input} >
            <TextField
              data-testid="github-url"
              label="GitHub repo URL"
              variant="outlined"
              {...register('gitrepoUrl', { required: true })}
            />
          </Box>
          <Box className={styles.Input}>
            <TextField
              data-testid="github-pat"
              label="Personal access token"
              variant="outlined"
              {...register('gitrepoAccessToken', { required: false })}
            />
          </Box>
          <Box className={styles.Input}>
            <TextField
              data-testid="dbt-target-schema"
              label="dbt target schema"
              variant="outlined"
              {...register('schema', { required: true })}
            />
          </Box>
          <Box className={styles.Input}>
            <Button variant="contained" type="submit" data-testid="save-github-url">
              Save
            </Button>
          </Box>
        </form>
      }

      {
        setupStatus === 'started' &&
        <>
          <div>Setting up workspace...</div>
          <div>{progressMessages.map(message => <div key={message.stepnum}>{message.stepnum}. {message.message}</div>)}</div>
          <div>...</div>
        </>
      }

      {
        setupStatus === 'completed' &&
        <>
          <div>Setup complete</div>
          <button onClick={() => onCreateWorkspace()}>Continue</button>
        </>
      }

      {
        setupStatus === 'failed' &&
        <>
          <div>Setup failed: {failureMessage}</div>
        </>
      }
    </>
  );
}
