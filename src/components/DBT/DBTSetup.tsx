import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const DBTSetup = () => {

  const { register, handleSubmit } = useForm({ defaultValues: { gitrepoUrl: '', gitrepoAccessToken: '', schema: 'public' } });
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState<any[]>([]);
  const [setupStatus, setSetupStatus] = useState("not-started");
  const [failureMessage, setFailureMessage] = useState(null);
  const [workspace, setWorkspace] = useState({ status: '', gitrepo_url: '', target_name: '', target_schema: '' });

  const checkProgress = async function (taskId: string) {

    await fetch(`${backendUrl}/api/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {

      if (response.ok) {
        response.json().then((message) => {

          setProgressMessages(message['progress']);

          const lastMessage = message['progress'][message['progress'].length - 1];

          if (lastMessage['status'] === 'completed') {
            setSetupStatus("completed");
            fetchDbtWorkspace();

          } else if (lastMessage['status'] === 'failed') {
            setSetupStatus("failed");
            setFailureMessage(lastMessage['message']);

          } else {
            setTimeout(() => { checkProgress(taskId) }, 2000);
          }
        });
      }
    });
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

    await fetch(`${backendUrl}/api/dbt/workspace/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify(payload),
    }).then((response) => {

      if (response.ok) {
        response.json().then((message) => {
          setTimeout(() => { checkProgress(message.task_id) }, 1000);
        });
      } else {
        response.json().then((message) => {
          console.error(message);
        })
        setSetupStatus("failed");
      }
    });
  };

  async function fetchDbtWorkspace() {

    if (!session) {
      return;
    }

    await fetch(`${backendUrl}/api/dbt/dbt_workspace`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {

      if (response.ok) {
        response.json().then((message) => {
          if (message.error === 'no dbt workspace has been configured') {
            setWorkspace({ ...workspace, status: 'fetched' });
            // do nothing
          } else if (message.error) {
            setFailureMessage(message.error);

          } else {
            message.status = 'fetched';
            setWorkspace(message);
          }
        });
      } else {

        response.json().then((message) => {
          console.error(message);
        })
      }
    });
  }

  if (workspace.status === '') {

    fetchDbtWorkspace();
  }

  return (
    <>
      {workspace.status &&
        <>
          <div>{workspace.gitrepo_url}</div>
          <div>dbt target: {workspace.target_name}</div>
          <div>dbt target schema: {workspace.target_schema}</div>
        </>
      }

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
              {...register('schema')}
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
        <div>Setup complete</div>
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
