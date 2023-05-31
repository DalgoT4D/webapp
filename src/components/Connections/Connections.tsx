import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import CreateConnectionForm from './CreateConnectionForm';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState<Array<Array<string>>>([]);

  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );
  const { data: sourcesData } = useSWR(`${backendUrl}/api/airbyte/sources`);

  const toastContext = useContext(GlobalContext);

  const [syncStatus, setSyncStatus] = useState<string>("");
  const [syncLogs, setSyncLogs] = useState<Array<string>>([]);

  // when the connection list changes
  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((connection: any, idx: number) => [
        connection.name,
        connection.sourceDest,
        connection.lastSync,
        [
          <Button
            variant="contained"
            onClick={() => syncConnection(connection)}
            key={idx}
          >
            Sync
          </Button>,
        ],
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

  const syncConnection = (connection: any) => {
    console.log(connection);
    (async () => {
      try {
        const message = await httpPost(
          session,
          `airbyte/connections/${connection.blockId}/sync/`,
          {}
        );
        if (message.success) {
          successToast("sync started", [], toastContext);
          if (message.celery_task_id) {
            checkCeleryTask(message.celery_task_id);
          }
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  };

  const checkCeleryTask = async (celeryTaskId: string) => {
    try {
      const result = await httpGet(session, `tasks/${celeryTaskId}`);
      if (result.progress && result.progress.length > 1) {
        const lastStep = result.progress[1]
        if (lastStep.airbyte_job_num) {
          const airbyteJob = await httpGet(session, `airbyte/jobs/${lastStep.airbyte_job_num}`);
          setSyncStatus(airbyteJob.status);
          if (airbyteJob.status === 'failed') {
            setSyncLogs(airbyteJob.logs);
          }
          if (['succeeded', 'failed'].indexOf(airbyteJob.status) < 0) {
            setTimeout(() => {
              checkCeleryTask(celeryTaskId);
            }, 3000);
          }
          // airbyteJob = {status, logs}
        } else if (lastStep.status) {
          errorToast(lastStep.status, [], toastContext);
        }
      } else {
        setTimeout(() => {
          checkCeleryTask(celeryTaskId);
        }, 3000);
      }
    }
    catch (error: any) {
      setTimeout(() => {
        checkCeleryTask(celeryTaskId);
      }, 5000);
    }
  };


  return (
    <>
      <CreateConnectionForm
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
