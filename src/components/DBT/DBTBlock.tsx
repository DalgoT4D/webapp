import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

type DbtBlock = {
  blockName: string;
  action: string;
}

export const DBTBlock = ({
  blockName,
  action
}: DbtBlock) => {

  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  const [running, setRunning] = useState(false);
  const [dbtRunLogs, setDbtRunLogs] = useState<string[]>([]);

  const runDbtJob = async function () {

    setRunning(true);
    setDbtRunLogs([]);

    try {
      const message = await httpPost(session, 'prefect/flows/dbt_run/', {
        blockName: blockName,
        // flowName: 'rc-flow-name',
        // flowRunName: 'rc-flow-run-name',
      });
      console.log(message);
      if (message?.status === 'success') {
        successToast('Job ran successfully', [], toastContext);
      } else {
        errorToast('Job failed', [], toastContext);
      }
      setDbtRunLogs(message.result);
    } catch (err: any) {
      console.error(err.cause);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
  };


  return (
    <Box sx={{ display: 'flex', alignItems: 'start', marginBottom: '20px' }}>
      {
        !running &&
        <Box sx={{ width: '100px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            data-testid={"dbtactionbutton-" + action}
            variant="contained"
            onClick={() => runDbtJob()}>
            dbt {action}
          </Button>
        </Box>
      }
      {
        running &&
        <Box sx={{ width: '100px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      }
      {
        <Box sx={{ border: '1px solid #092540', borderRadius: '5px', 'padding': '10px', overflow: 'scroll', height: '100px', width: '600px' }}>
          {dbtRunLogs.map((log, idx) => <Typography key={idx} data-testid={'logline-' + idx}>{log}</Typography>)}
        </Box>
      }
    </Box>
  );
};
