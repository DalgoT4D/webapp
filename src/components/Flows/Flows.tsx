import { Box, Button, Typography, CircularProgress } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import FlowIcon from '@/assets/icons/flow.svg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete, httpPost } from '@/helpers/http';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { List } from '../List/List';
import { httpGet } from '@/helpers/http';
import { SingleFlowRunHistory, FlowRun } from './SingleFlowRunHistory';
import { lastRunTime, cronToString, trimEmail } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import Image from 'next/image';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';

interface BlockLock {
  lockedBy: string;
  lockedAt: string;
}

export interface FlowInterface {
  name: string;
  cron: string;
  deploymentName: string;
  deploymentId: string;
  lastRun?: FlowRun;
  lock: BlockLock | undefined | null;
  status: boolean;
}

export interface FlowsInterface {
  flows: Array<FlowInterface>;
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
  setSelectedFlow: (arg: string) => any;
}

const flowState = (flow: FlowInterface) => {
  if (!flow.lastRun) {
    return (
      <Box
        data-testid={'flowstate-' + flow.name}
        sx={{
          display: 'flex',
          color: '#399D47',
          gap: '3px',
          alignItems: 'center',
        }}
      >
        &mdash;
      </Box>
    );
  }
  return (
    <>
      {flow.lastRun?.status === 'COMPLETED' ? (
        <Box
          data-testid={'flowstate-' + flow.name}
          sx={{
            display: 'flex',
            color: '#399D47',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <TaskAltIcon
            sx={{ alignItems: 'center', fontWeight: 700, fontSize: 'large' }}
          />
          <Typography component="p" fontWeight={700}>
            Success
          </Typography>
        </Box>
      ) : (
        <Box
          data-testid={'flowstate-' + flow.name}
          sx={{
            display: 'flex',
            color: '#981F1F',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          <WarningAmberIcon
            sx={{ alignItems: 'center', fontWeight: 700, fontSize: 'large' }}
          />
          <Typography component="p" fontWeight={700}>
            Failed
          </Typography>
        </Box>
      )}
    </>
  );
};

const flowStatus = (status: boolean) => (
  <Typography component="p" fontWeight={600}>
    {status ? 'Active' : 'Inactive'}
  </Typography>
);

const flowLastRun = (flow: FlowInterface) => {
  return (
    <>
      {flow?.lastRun ? (
        <Typography
          data-testid={'flowlastrun-' + flow.name}
          fontWeight={600}
          component="p"
        >
          {lastRunTime(
            flow?.lastRun?.startTime || flow?.lastRun?.expectedStartTime
          )}
        </Typography>
      ) : (
        <Box
          data-testid={'flowlastrun-' + flow.name}
          sx={{
            display: 'flex',
            color: '#399D47',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          &mdash;
        </Box>
      )}
    </>
  );
};

export const Flows = ({
  flows,
  updateCrudVal,
  mutate,
  setSelectedFlow,
}: FlowsInterface) => {
  const [lastFlowRun, setLastFlowRun] = useState<FlowRun>();
  const [runningDeploymentId, setRunningDeploymentId] = useState<string>('');
  const [deploymentId, setDeploymentId] = useState<string>('');
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);
  const [deleteFlowLoading, setDeleteFlowLoading] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteConnection = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
  };

  const handleEditConnection = () => {
    handleClose();
    setSelectedFlow(deploymentId);
    updateCrudVal('update');
  };

  const handleClick = (blockId: string, event: HTMLElement | null) => {
    setDeploymentId(blockId);
    setAnchorEl(event);
  };
  // when the connection list changes
  let rows = [];

  rows = useMemo(() => {
    if (flows && flows.length >= 0) {
      return flows.map((flow: FlowInterface, idx: number) => [
        <Box
          key={`name-${flow.deploymentId}`}
          sx={{ display: 'flex', alignItems: 'center', alignContent: 'center' }}
        >
          <Image style={{ marginRight: 10 }} src={FlowIcon} alt="flow icon" />
          <Typography variant="h6" fontWeight={700}>
            {`${flow.name} | `}
          </Typography>
          <Typography
            variant="subtitle2"
            color="rgba(9, 37, 64, 0.87)"
            fontWeight={700}
          >
            &nbsp; {cronToString(flow.cron)}
          </Typography>
        </Box>,
        flowStatus(flow.status),

        flowLastRun(flow),
        flow.lock ? <CircularProgress /> : flowState(flow),

        <Box key={idx}>
          <Button
            variant="contained"
            color="info"
            data-testid={'btn-openhistory-' + flow.name}
            sx={{
              fontWeight: 600,
              marginRight: '5px',
            }}
            onClick={() => fetchLastFlowRun(flow.deploymentId)}
          >
            last logs
          </Button>
          {flow.lock ? (
            <>
              <Typography variant="body2" fontWeight={600}>
                Triggered by: {trimEmail(flow.lock.lockedBy)}
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {lastRunTime(flow.lock.lockedAt)}
              </Typography>
            </>
          ) : (
            <>
              <Button
                sx={{ mr: 1 }}
                data-testid={'btn-quickrundeployment-' + flow.name}
                variant="contained"
                disabled={!!flow.lock}
                onClick={() => {
                  setRunningDeploymentId(flow.deploymentId);
                  handleQuickRunDeployment(flow.deploymentId);
                }}
              >
                Run
              </Button>
              <Button
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={(event) =>
                  handleClick(flow.deploymentId, event.currentTarget)
                }
                variant="contained"
                key={'menu-' + idx}
                color="info"
                sx={{ px: 0, minWidth: 32 }}
              >
                <MoreHorizIcon />
              </Button>
            </>
          )}
        </Box>,
      ]);
    }
    return [];
  }, [flows, runningDeploymentId]);

  const fetchLastFlowRun = async (deploymentId: string) => {
    try {
      const response = await httpGet(
        session,
        `prefect/flows/${deploymentId}/flow_runs/history?limit=1&fetchlogs=false`
      );
      if (response.length > 0) {
        setLastFlowRun(response[0]);
      } else {
        setLastFlowRun(undefined);
      }

    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const handleClickCreateFlow = () => {
    updateCrudVal('create');
  };

  const handleQuickRunDeployment = (deploymentId: string) => {
    (async () => {
      try {
        await httpPost(session, `prefect/flows/${deploymentId}/flow_run`, {});
        successToast('Flow run inititated successfully', [], toastContext);
        mutate();
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setRunningDeploymentId('');
      }
    })();
  };

  const handleDeleteFlow = () => {
    (async () => {
      setDeleteFlowLoading(true);
      try {
        const data = await httpDelete(session, `prefect/flows/${deploymentId}`);
        if (data?.success) {
          successToast('Flow deleted successfully', [], toastContext);
        } else {
          errorToast('Something went wrong', [], toastContext);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        mutate();
        handleClose();
        setShowConfirmDeleteDialog(false);
      }
      setDeleteFlowLoading(false);
    })();
  };

  return (
    <>
      <ActionsMenu
        eleType="flow"
        anchorEl={anchorEl}
        open={open}
        handleEdit={handleEditConnection}
        handleClose={handleClose}
        handleDelete={handleDeleteConnection}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Pipelines
        </Typography>
      </Box>

      <List
        rows={rows}
        openDialog={handleClickCreateFlow}
        headers={['', 'Pipeline Status', 'Last run', 'Last run status']}
        title={'Pipeline'}
      />

      <SingleFlowRunHistory flowRun={lastFlowRun} />

      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => setShowConfirmDeleteDialog(false)}
        handleConfirm={() => handleDeleteFlow()}
        message="This will permanently delete the pipeline, which will also delete the sequence and remove it completely from the listing."
        loading={deleteFlowLoading}
      />
    </>
  );
};
