import { Box, Grid, Paper } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { Typography } from '@mui/material';
import { PageHead } from '@/components/PageHead';
import { DBTSetup } from '@/components/DBT/DBTSetup';
import { DBTCreateProfile } from '@/components/DBT/DBTCreateProfile';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';


export default function Transform() {

  const [workspace, setWorkspace] = useState({ status: '', gitrepo_url: '', default_schema: '' });
  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);

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
            errorToast(message.error, [], context);

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

    const response = await fetch(`${backendUrl}/api/prefect/blocks/dbt/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
    });

    if (response.ok) {
      const message = await response.json();
      console.log(message);
      setDispBlocks(message.map((block: dbtBlock) => {
        return {
          blockName: block.blockName,
          displayName: block.blockName.split('-')[3],
        }
      }));
    } else {
      const error = await response.json();
      errorToast(JSON.stringify(error), [], context);
    }
  };

  useEffect(() => {
    fetchDbtBlocks()
  }, []);

  const runDbtJob = async function (block: displayBlock) {

    const response = await fetch(`${backendUrl}/api/prefect/flows/dbt_run/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        blockName: block.blockName,
        // flowName: 'rc-flow-name',
        // flowRunName: 'rc-flow-run-name',
      })
    });

    if (response.ok) {
      const message = await response.json();
      console.log(message);
      successToast("Job ran successfully", [], context);
      setDbtRunLogs(message);
    }
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
                  !workspace &&
                  <DBTSetup />
                }
                {/* create profile */
                  workspace && workspace.status &&
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
                      dispBlocks.length > 0 &&
                      dispBlocks.map((dispBlock) => (
                        <div key={dispBlock.blockName}>
                          <button onClick={() => runDbtJob(dispBlock)}>
                            {dispBlock.displayName}
                          </button>
                        </div>
                      ))
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
