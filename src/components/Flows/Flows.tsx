import { Box, Button, IconButton, Typography } from '@mui/material';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { Delete } from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete, httpPost } from '@/helpers/http';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { List } from '../List/List';
import FlowRunHistory from './FlowRunHistory';

interface FlowInterface {
  name: string;
  cron: string;
  deploymentName: string;
  deploymentId: string;
  lastRun: any;
}

interface FlowsInterface {
  flows: Array<FlowInterface>;
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
}

const lastRunTime = (startTime: string) => {
  return moment(new Date(startTime)).fromNow();
};

const FlowState = (flow: any) => {
  return (
    <>
      {!flow?.lastRun || flow?.lastRun?.status === 'COMPLETED' ? (
        <Box
          sx={{
            display: 'flex',
            color: '#399D47',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <TaskAltIcon sx={{ alignItems: 'center', fontSize: 'medium' }} />
          <Typography component="p">Running</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            color: '#981F1F',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <WarningAmberIcon sx={{ alignItems: 'center', fontSize: 'medium' }} />
          <Typography component="p">Failed</Typography>
        </Box>
      )}
    </>
  );
};

const FlowLastRun = (flow: any) => {
  return (
    <>
      {flow?.lastRun ? (
        <Typography component="p">
          Last run {lastRunTime(flow?.lastRun?.startTime)}
        </Typography>
      ) : (
        '-'
      )}
    </>
  );
};

const Flows = ({ flows, updateCrudVal, mutate }: FlowsInterface) => {
  const [rows, setRows] = useState<Array<Array<any>>>([]);
  const [showFlowRunHistory, setShowFlowRunHistory] = useState<boolean>(false);
  const [flowRunHistoryDeploymentId, setFlowRunHistoryDeploymentId] =
    useState<string>('');
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  useEffect(() => {
    if (flows && flows.length > 0) {
      const rows = flows.map((flow: any, idx: number) => [
        `${flow.name} | ${flow.cron}`,
        FlowState(flow),
        FlowLastRun(flow),
        [
          <Box key={idx}>
            <Button
              sx={{
                marginRight: '5px',
                backgroundColor: 'background.default',
              }}
              onClick={() => handleOpenFlowRunHistory(flow?.deploymentId)}
            >
              last logs
            </Button>
            <Button
              variant="contained"
              onClick={() => handleQuickRunDeployment(flow?.deploymentId)}
            >
              Run
            </Button>
            <IconButton onClick={() => handleDeleteFlow(flow.deploymentId)}>
              <Delete />
            </IconButton>
          </Box>,
        ],
      ]);
      setRows(rows);
    }
  }, [flows]);

  const handleOpenFlowRunHistory = (deploymentId: string) => {
    setFlowRunHistoryDeploymentId(deploymentId);
    setShowFlowRunHistory(true);
  };

  const handleClickCreateFlow = () => {
    updateCrudVal('create');
  };

  const handleQuickRunDeployment = (deploymentId: string) => {
    (async () => {
      try {
        await httpPost(session, `prefect/flows/${deploymentId}/flow_run`, {});
        successToast('Flow run inititated successfully', [], toastContext);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  };

  const handleDeleteFlow = (deploymentId: string) => {
    (async () => {
      try {
        const data = await httpDelete(session, `prefect/flows/${deploymentId}`);
        mutate();
        if (data?.success) {
          successToast('Flow deleted successfully', [], toastContext);
        } else {
          errorToast('Something went wrong', [], toastContext);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Flows
        </Typography>
      </Box>

      <List
        rows={rows}
        openDialog={handleClickCreateFlow}
        headers={['Flow', 'Status', 'Last Run']}
        title={'Flow'}
      />

      <FlowRunHistory
        showFlowRunHistory={showFlowRunHistory}
        setShowFlowRunHistory={setShowFlowRunHistory}
        deploymentId={flowRunHistoryDeploymentId}
      />
    </>
  );
};

export default Flows;
