import { Button, MenuItem, Select } from '@mui/material';

import React, { useContext, useState } from 'react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import SyncIcon from '@/assets/icons/sync.svg';
import Image from 'next/image';
import styles from './../Connections/Connections.module.css';

export type DbtBlock = {
  blockName: string;
  blockId: string;
  blockType: string;
  target: string;
  action: string;
  deploymentId: string;
};

type params = {
  blocks: DbtBlock[];
  setRunning: any;
  setDbtRunLogs: any;
  setExpandLogs: any;
};

type PrefectFlowRunLog = {
  level: number;
  timestamp: string;
  message: string;
};

type PrefectFlowRun = {
  id: string;
  name: string;
  deployment_id: string;
  flow_id: string;
  state_type: string;
  state_name: string;
};

export const DBTTarget = ({
  blocks,
  setDbtRunLogs,
  setRunning,
  setExpandLogs,
}: params) => {
  const [selectedBlock, setSelectedBlock] =
    useState<string>('Select functions');
  const toastContext = useContext(GlobalContext);
  const { data: session }: any = useSession();
  const runBlock = blocks.filter((block) => block.action === 'run');
  const otherBlocks = blocks.filter((block) => block.action !== 'run');
  const [deploymentRunning, setDeploymentRunning] = useState<boolean>(false);

  const runDbtJob = async function (selectedBlock: string) {
    setRunning(true);
    setExpandLogs(true);
    setDbtRunLogs([]);

    try {
      const message = await httpPost(session, 'prefect/flows/dbt_run/', {
        blockName: selectedBlock,
      });
      if (message?.status === 'success') {
        successToast('Job ran successfully', [], toastContext);
      } else {
        errorToast('Job failed', [], toastContext);
      }
      setDbtRunLogs(message?.result);
    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
  };

  const fetchFlowRunStatus = async (flow_run_id: string) => {
    try {
      const flowRun: PrefectFlowRun = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}`
      );

      if (!flowRun.state_type) return 'FAILED';

      return flowRun.state_type;
    } catch (err: any) {
      console.error(err);
      return 'FAILED';
    }
  };

  const fetchAndSetFlowRunLogs = async (flow_run_id: string) => {
    try {
      const response = await httpGet(
        session,
        `prefect/flow_runs/${flow_run_id}/logs`
      );
      if (response?.logs?.logs && response.logs.logs.length > 0) {
        const logsArray = response.logs.logs.map(
          // eslint-disable-next-line
          (logObject: PrefectFlowRunLog, idx: number) =>
            `- ${logObject.message} '\n'`
        );

        setDbtRunLogs(logsArray);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const dbtRunWithDeployment = async (block: any) => {
    if (block.deploymentId) {
      setExpandLogs(true);
      setDeploymentRunning(true);
      try {
        const response = await httpPost(
          session,
          `prefect/flows/${block.deploymentId}/flow_run`,
          {}
        );

        // if flow run id is not present, something went wrong
        if (!response.flow_run_id)
          errorToast('Something went wrong', [], toastContext);

        // Poll and show logs till flow run is either completed or failed
        let flowRunStatus: string = await fetchFlowRunStatus(
          response.flow_run_id
        );

        while (!['COMPLETED', 'FAILED'].includes(flowRunStatus)) {
          await new Promise((r) => setTimeout(r, 5000));
          await fetchAndSetFlowRunLogs(response.flow_run_id);
          flowRunStatus = await fetchFlowRunStatus(response.flow_run_id);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      } finally {
        setDeploymentRunning(false);
      }
      setDeploymentRunning(false);
    }
  };

  return (
    <>
      {runBlock.map((run) => (
        <Button
          data-testid="runJob"
          key={run.blockName}
          variant="contained"
          sx={{ mr: 2 }}
          onClick={() => dbtRunWithDeployment(run)}
          disabled={deploymentRunning}
        >
          {deploymentRunning ? (
            <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
          ) : (
            'Run'
          )}
        </Button>
      ))}
      <Image src={SyncIcon} className={styles.SyncIcon} alt="sync icon" />
      <Select
        value={selectedBlock}
        onChange={(event) => {
          runDbtJob(event.target.value);
          setSelectedBlock(event.target.value);
        }}
      >
        <MenuItem value="Select functions" disabled>
          Select functions
        </MenuItem>
        {otherBlocks.map((block) => (
          <MenuItem
            key={block.blockName}
            value={block.blockName}
          >{`DBT ${block.action}`}</MenuItem>
        ))}
      </Select>
    </>
  );
};
