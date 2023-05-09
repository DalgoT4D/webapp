import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const DBTSetup = () => {

  const { register, handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const [progressMessages, setProgressMessages] = useState([]);
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

          var lastMessage = message['progress'][message['progress'].length - 1];

          if (lastMessage['status'] === 'completed') {
            setSetupStatus("completed");

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

    await fetch(`${backendUrl}/api/dbt/workspace/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        gitrepoUrl: data.gitrepoUrl,
        dbtVersion: "1.4.5",
        profile: {
          name: 'dbt',
          target: 'dev',
          target_configs_schema: 'public',
        }
      }),
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


  async function fetchCurrentUser() {

    if (!session) {
      return;
    }

    await fetch(`${backendUrl}/api/currentuser`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    }).then((response) => {

      if (response.ok) {
        response.json().then((message) => {
          console.log(message);
        });
      } else {

        response.json().then((message) => {
          console.error(message);
        })
      }
    });
  }

  // fetchCurrentUser();

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
              id="outlined-basic"
              label="GitHub repo URL"
              variant="outlined"
              {...register('gitrepoUrl', { required: true })}
            />
          </Box>
          <Box className={styles.Input}>
            <Button variant="contained" type="submit">
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
