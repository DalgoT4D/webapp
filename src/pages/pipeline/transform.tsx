import { Box, Grid, Paper } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { DBTSetup } from '@/components/DBT/DBTSetup';
import { DBTCreateProfile } from '@/components/DBT/DBTCreateProfile';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost, httpGet } from '@/helpers/http';

export default function Transform() {

  const [workspace, setWorkspace] = useState({ status: '', gitrepo_url: '', default_schema: '' });
  const [dbtJobStatus, setDbtJobStatus] = useState<boolean>(false);
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  type displayBlock = {
    blockName: string;
    displayName: string;
  };
  const [dispBlocks, setDispBlocks] = useState<displayBlock[]>([]);

  const [dbtRunLogs, setDbtRunLogs] = useState<string[]>([]);

  async function fetchDbtWorkspace() {

    if (!session) {
      return;
    }

    try {
      const message = await httpGet(session, 'dbt/dbt_workspace');
      if (message.error === 'no dbt workspace has been configured') {
        setWorkspace({ ...workspace, status: 'fetched' });
        // do nothing
      } else if (message.error) {
        errorToast(message.error, [], toastContext);

      } else {
        message.status = 'fetched';
        setWorkspace(message);
      }
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    };

  }

  useEffect(() => {
    fetchDbtWorkspace();
  }, []);

  const onCreatedProfile = async function (blockNames: string[]) {
    setDispBlocks(blockNames.map((blockName: string) => {
      return {
        blockName,
        displayName: blockName.split('-')[3],
      }
    }));
  };

  type dbtBlock = {
    blockType: string,
    blockId: string,
    blockName: string,
  };

  const fetchDbtBlocks = async function () {

    try {
      const message = await httpGet(session, 'prefect/blocks/dbt');
      setDispBlocks(message.map((block: dbtBlock) => {
        return {
          blockName: block.blockName,
          displayName: block.blockName.split('-')[3],
        }
      }));
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    };
  };

  useEffect(() => {
    fetchDbtBlocks()
  }, []);

  const runDbtJob = async function (block: displayBlock) {

    setDbtJobStatus(true);
    setDbtRunLogs([]);

    try {
      const message = await httpPost(session, 'prefect/flows/dbt_run/', {
        blockName: block.blockName,
        // flowName: 'rc-flow-name',
        // flowRunName: 'rc-flow-run-name',
      });
      console.log(message);
      successToast("Job ran successfully", [], toastContext);
      setDbtRunLogs(message);
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    };

    setDbtJobStatus(false);
  };

  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Typography variant="h1" gutterBottom color="primary.main">
          DDP platform transform page
        </Typography>
        <Box className={styles.Container}>
          <Grid container columns={5}>
            <Grid item xs={8}>
              <Paper elevation={3} sx={{ p: 4 }}>
                {/* add github info */
                  !workspace.gitrepo_url &&
                  <DBTSetup onCreateWorkspace={() => fetchDbtWorkspace()} />
                }
                {/* create profile */
                  workspace && workspace.gitrepo_url &&
                  <>
                    <div>
                      <a href={workspace.gitrepo_url}>GitHub repo</a>
                    </div>
                    <div>default target schema: {workspace.default_schema}</div>
                    {
                      dispBlocks.length === 0 &&
                      <DBTCreateProfile createdProfile={onCreatedProfile} />
                    }
                    {
                      dispBlocks.length > 0 && !dbtJobStatus &&
                      <>
                        {
                          dispBlocks.map((dispBlock: displayBlock) => (
                            <div key={dispBlock.blockName}>
                              <button onClick={() => runDbtJob(dispBlock)}>
                                {dispBlock.displayName}
                              </button>
                            </div>
                          ))
                        }
                      </>
                    }
                    {
                      dispBlocks.length > 0 && dbtJobStatus &&
                      <>
                        <div>Please wait...</div>
                      </>
                    }
                    {
                      dbtRunLogs.length > 0 &&
                      <div style={{ border: "2px solid darkgray", borderRadius: "4px", padding: "5px" }}>
                        {
                          dbtRunLogs.map((logMessage, idx) => (
                            <div key={idx}>{logMessage}</div>
                          ))
                        }
                      </div>
                    }
                  </>
                }
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </main>
    </>
  );
}
