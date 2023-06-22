import { Button, MenuItem, Select } from '@mui/material';

import React, { useContext, useState } from 'react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';

export type DbtBlock = {
  blockName: string;
  displayName: string;
  target: string;
  action: string;
};

type params = {
  blocks: DbtBlock[];
  setRunning: any;
  setDbtRunLogs: any;
  setExpandLogs: any;
};

export const DBTTarget = ({
  blocks,
  setDbtRunLogs,
  setRunning,
  setExpandLogs,
}: params) => {
  const [selectedBlock, setSelectedBlock] = useState<string>('Select functions');
  const toastContext = useContext(GlobalContext);
  const { data: session }: any = useSession();
  const runBlock = blocks.filter((block) => block.action === 'run');
  const otherBlocks = blocks.filter((block) => block.action !== 'run');

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

  return (
    <>
      {runBlock.map((run) => (
        <Button
          data-testid="runJob"
          key={run.blockName}
          variant="contained"
          sx={{ mr: 2 }}
          onClick={() => runDbtJob(run.blockName)}
        >
          Run{' '}
        </Button>
      ))}
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
