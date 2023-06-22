import { Box, Button, Typography } from '@mui/material';
import React, { useContext, useMemo, useState } from 'react';
import SyncIcon from '@/assets/icons/sync.svg';
import FlowIcon from '@/assets/icons/flow.svg';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpDelete, httpPost } from '@/helpers/http';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { List } from '../List/List';
import { FlowRunHistory, FlowRun } from './FlowRunHistory';
import { lastRunTime } from '@/utils/common';
import { ActionsMenu } from '../UI/Menu/Menu';
import styles from './Flows.module.css';
import Image from 'next/image';
import ConfirmationDialog from '../Dialog/ConfirmationDialog';

export interface FlowInterface {
  name: string;
  cron: string;
  deploymentName: string;
  deploymentId: string;
  lastRun?: FlowRun;
}

export interface FlowsInterface {
  flows: Array<FlowInterface>;
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
}

const FlowState = (flow: FlowInterface) => {
  return (
    <>
      {!flow.lastRun || flow.lastRun?.status === 'COMPLETED' ? (
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
            Running
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

const FlowLastRun = (flow: FlowInterface) => {
  return (
    <>
      {flow?.lastRun ? (
        <Typography
          data-testid={'flowlastrun-' + flow.name}
          fontWeight={600}
          component="p"
        >
          Last run {lastRunTime(flow?.lastRun?.startTime)}
        </Typography>
      ) : (
        '-'
      )}
    </>
  );
};

export const Flows = ({ flows, updateCrudVal, mutate }: FlowsInterface) => {
  const [showFlowRunHistory, setShowFlowRunHistory] = useState<boolean>(false);
  const [flowRunHistoryDeploymentId, setFlowRunHistoryDeploymentId] =
    useState<string>('');
  const [runningDeploymentId, setRunningDeploymentId] = useState<string>('');
  const [deploymentId, setDeploymentId] = useState<string>('');
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] =
    useState<boolean>(false);

  const open = Boolean(anchorEl);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteConnection = () => {
    handleClose();
    setShowConfirmDeleteDialog(true);
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
          key={`name-${flow?.deploymentId}`}
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
            &nbsp; by 12pm time every day
          </Typography>
        </Box>,

        FlowState(flow),
        FlowLastRun(flow),

        <Box key={idx}>
          <Button
            variant="contained"
            color="info"
            data-testid={'btn-openhistory-' + flow.name}
            sx={{
              fontWeight: 600,
              marginRight: '5px',
            }}
            onClick={() => handleOpenFlowRunHistory(flow.deploymentId)}
          >
            last logs
          </Button>
          <Button
            sx={{ mr: 1 }}
            data-testid={'btn-quickrundeployment-' + flow.name}
            variant="contained"
            disabled={runningDeploymentId === flow.deploymentId}
            onClick={() => {
              setRunningDeploymentId(flow.deploymentId);
              handleQuickRunDeployment(flow.deploymentId);
            }}
          >
            {runningDeploymentId === flow.deploymentId ? (
              <Image
                src={SyncIcon}
                className={styles.SyncIcon}
                alt="sync icon"
              />
            ) : (
              'Run'
            )}
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
        </Box>,
      ]);
    }
    return [];
  }, [flows, runningDeploymentId]);

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
      } finally {
        setRunningDeploymentId('');
      }
    })();
  };

  const handleDeleteFlow = () => {
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
      } finally {
        handleClose();
        setShowConfirmDeleteDialog(false);
      }
    })();
  };

  return (
    <>
      <ActionsMenu
        anchorEl={anchorEl}
        open={open}
        handleClose={handleClose}
        elementId={deploymentId}
        handleDeleteConnection={handleDeleteConnection}
      />
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

      <ConfirmationDialog
        show={showConfirmDeleteDialog}
        handleClose={() => setShowConfirmDeleteDialog(false)}
        handleConfirm={() => handleDeleteFlow()}
        message="This will permanently delete the Orchestration, which will also delete the sequence and remove it completely from the listing."
      />
    </>
  );
};
