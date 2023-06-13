import { DBTCreateProfile } from '@/components/DBT/DBTCreateProfile';
import { DBTSetup } from '@/components/DBT/DBTSetup';
import { PageHead } from '@/components/PageHead';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';
import styles from '@/styles/Home.module.css';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
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
import { DBTTarget } from '@/components/DBT/DBTTarget';

type DbtBlock = {
  blockName: string;
  displayName: string;
  target: string;
  action: string;
};
type TargetBlocks = {
  [id: string]: DbtBlock[];
};
type ExpandTarget = {
  [id: string]: boolean;
};

const Transform = () => {
  const [workspace, setWorkspace] = useState({
    status: '',
    gitrepo_url: '',
    default_schema: '',
  });
  const [dbtBlocks, setDbtBlocks] = useState<TargetBlocks>({});
  const [dbtSetupStage, setDbtSetupStage] = useState<string>(''); // create-workspace, create-profile, complete
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [showConnectRepoDialog, setShowConnectRepoDialog] =
    useState<boolean>(false);
  const [showAddProfileDialog, setShowAddProfileDialog] =
    useState<boolean>(false);
  const [rerender, setRerender] = useState<boolean>(false);
  const [dbtSetupLogs, setDbtSetupLogs] = useState<string[]>([]);

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

      const blocksByTarget: TargetBlocks = {};
      const expandByTargets: ExpandTarget = {};

      response?.forEach((block: DbtBlock) => {
        // const components: string[] = block.blockName.split('-');
        // block.target = block?.dbtTargetSchem;
        // block.action = components[3];

        if (!blocksByTarget.hasOwnProperty(block.target)) {
          blocksByTarget[block.target] = [];
          expandByTargets[block.target] = false;
        }
        blocksByTarget[block.target].push(block);
      });

      setDbtBlocks(blocksByTarget);

      if (response && response?.length > 0) {
        setDbtSetupStage('complete');
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  useEffect(() => {
    fetchDbtWorkspace();
  }, [session, rerender]);

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
            Object.keys(dbtBlocks).map((target) => (
              <DBTTarget
                key={target}
                target={target}
                blocks={dbtBlocks[target]}
              />
            ))
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
              setLogs={setDbtSetupLogs}
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
                    transform: !expandLogs ? 'rotate(0deg)' : 'rotate(180deg)',
                  }}
                />
              </IconButton>
            </CardActions>
            <Collapse in={expandLogs} unmountOnExit>
              {
                <CardContent>
                  {dbtSetupLogs?.map((logMessage, idx) => (
                    <Box key={idx}>{logMessage}</Box>
                  ))}
                </CardContent>
              }
            </Collapse>
          </Card>
        </Box>
      </main>
    </>
  );
};

export default Transform;
