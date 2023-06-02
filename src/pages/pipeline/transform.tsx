import { DBTCreateProfile } from '@/components/DBT/DBTCreateProfile';
import { DBTSetup } from '@/components/DBT/DBTSetup';
import { List } from '@/components/List/List';
import { PageHead } from '@/components/PageHead';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Collapse,
  IconButton,
  Link,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Dbt from '@/images/dbt.png';
import Image from 'next/image';

type DbtBlock = {
  blockName: string;
  displayName: string;
};

const Transform = () => {
  const [workspace, setWorkspace] = useState({
    status: '',
    gitrepo_url: '',
    default_schema: '',
  });
  const [dbtBlocks, setDbtBlocks] = useState<DbtBlock[]>([]);
  const [dbtRunLogs, setDbtRunLogs] = useState<string[]>([]);
  const [dbtJobStatus, setDbtJobStatus] = useState<boolean>(false);
  const [dbtSetupStage, setDbtSetupStage] = useState<string>(''); // create-workspace, create-profile, complete
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [showConnectRepoDialog, setShowConnectRepoDialog] =
    useState<boolean>(false);
  const [showAddProfileDialog, setShowAddProfileDialog] =
    useState<boolean>(false);
  const [rerender, setRerender] = useState<boolean>(false);

  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  const fetchDbtWorkspace = async () => {
    if (!session) return;

    try {
      const response = await httpGet(session, 'dbt/dbt_workspace');
      setDbtSetupStage('create-workspace');
      if (response.error === 'no dbt workspace has been configured') {
        setWorkspace({ ...workspace, status: 'fetched' });
        // do nothing
      } else if (response.error) {
        errorToast(response.error, [], toastContext);
      } else {
        response.status = 'fetched';
        setWorkspace(response);
        setDbtSetupStage('create-profile');
        fetchDbtBlocks();
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const fetchDbtBlocks = async () => {
    if (!session) return;
    try {
      const response = await httpGet(session, 'prefect/blocks/dbt');
      setDbtBlocks(
        response.map((block: DbtBlock) => {
          return [
            block.blockName.split('-')[3],
            <>
              <Button variant="contained" onClick={() => runDbtJob(block)}>
                Run
              </Button>
            </>,
          ];
        })
      );
      if (response && response?.length > 0) setDbtSetupStage('complete');
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session, rerender]);

  const runDbtJob = async function (block: DbtBlock) {
    setDbtJobStatus(true);
    setDbtRunLogs([]);

    try {
      const message = await httpPost(session, 'prefect/flows/dbt_run/', {
        blockName: block.blockName,
        // flowName: 'rc-flow-name',
        // flowRunName: 'rc-flow-run-name',
      });
      console.log(message);
      if (message?.success)
        successToast('Job ran successfully', [], toastContext);
      // setDbtRunLogs(message);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }

    setDbtJobStatus(false);
    console.log('inside dbt run block');
  };

  return (
    <>
      <PageHead title="This is the new one" />
      <main className={styles.main}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Transformation
        </Typography>
        <Card
          sx={{
            background: 'white',
            display: 'flex',
            borderRadius: '8px',
            padding: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
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
            <Image
              src={Dbt}
              alt="Banner"
              style={{ width: '46px', height: '46px' }}
            />
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
              {workspace && workspace.gitrepo_url ? (
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
                    href={workspace?.gitrepo_url || '#'}
                  >
                    <Typography sx={{ fontWeight: 600, color: '#0F2440' }}>
                      {workspace?.gitrepo_url}
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
                      {workspace?.default_schema}
                    </Typography>
                  </Box>
                </>
              ) : (
                ''
              )}
            </Box>
          </Box>
          <Box>
            {dbtSetupStage === 'create-workspace' ? (
              <Button
                variant="contained"
                onClick={() => setShowConnectRepoDialog(true)}
              >
                Connect & Setup Repo{' '}
              </Button>
            ) : dbtSetupStage === 'create-profile' ? (
              <Button
                variant="contained"
                onClick={() => setShowAddProfileDialog(true)}
              >
                Add Profile
              </Button>
            ) : (
              ''
            )}
          </Box>
        </Card>
        <Box>
          {dbtSetupStage === 'complete' ? ( // show blocks list
            <List
              title={'Dbt Setup'}
              headers={['Block']}
              rows={dbtBlocks}
              openDialog={() =>
                console.log('do nothing, this button is hidden')
              }
              onlyList={true}
            />
          ) : dbtSetupStage === 'create-profile' ? (
            <DBTCreateProfile
              createdProfile={() => {
                setDbtSetupStage('complete');
                setRerender(!rerender);
              }}
              showDialog={showAddProfileDialog}
              setShowDialog={setShowAddProfileDialog}
            />
          ) : dbtSetupStage === 'create-workspace' ? (
            <DBTSetup
              setLogs={setDbtRunLogs}
              setExpandLogs={setExpandLogs}
              onCreateWorkspace={() => {
                setDbtSetupStage('create-profile');
                setRerender(!rerender);
              }}
              showDialog={showConnectRepoDialog}
              setShowDialog={setShowConnectRepoDialog}
            />
          ) : (
            ''
          )}
          <Card
            sx={{
              marginTop: '10px',
              padding: '4px',
              borderRadius: '8px',
              color: '#092540',
            }}
          >
            <CardActions
              sx={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <Box>Logs</Box>
              <IconButton onClick={() => setExpandLogs(!expandLogs)}>
                <ExpandMoreIcon
                  sx={{
                    transform: expandLogs ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                />
              </IconButton>
            </CardActions>
            <Collapse in={expandLogs} unmountOnExit>
              {!dbtJobStatus ? (
                <CardContent>
                  {dbtRunLogs?.map((logMessage, idx) => (
                    <Box key={idx}>{logMessage}</Box>
                  ))}
                </CardContent>
              ) : (
                <CircularProgress />
              )}
            </Collapse>
          </Card>
        </Box>
      </main>
    </>
  );
};

export default Transform;
