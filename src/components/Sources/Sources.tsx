import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { CircularProgress } from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import CreateSourceForm from './CreateSourceForm';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [setupStep, setSetupStep] = useState<string>("not-started");


  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
      ]);
      setRows(rows);
    }
  }, [data]);

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    try {
      setSetupStep("creating-source");
      const newSource = await httpPost(session, 'airbyte/sources/', {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      // check connectivity
      setSetupStep("checking-connectivity");
      checkSourceConnectivity(newSource['sourceId'], mutate);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const checkSourceConnectivity = async (sourceId: string, mutator: any) => {
    try {
      const checkResponse = await httpPost(session, `airbyte/sources/${sourceId}/check/`, {})
      if (checkResponse.task_id) {
        // wait five seconds before checking on the task's progress
        setTimeout(() => {
          checkSourceConnectivityTask(checkResponse.task_id, sourceId, mutator);
        }, 5000);
      } else {
        console.error(checkResponse);
        errorToast("Something went wrong", [], toastContext);
        setSetupStep("not-started");
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const checkSourceConnectivityTask = async (taskId: string, sourceId: string, mutator: any) => {
    try {
      const taskStatus = await httpGet(session, `tasks/${taskId}`);
      const steps = taskStatus.progress;
      // this task has only two steps
      if (steps.length === 2) {
        if (steps[1].status === 'completed') {
          mutator();
          handleClose();
          successToast('Source added', [], toastContext);
          setSetupStep("done");
        } else {
          await httpDelete(session, `airbyte/sources/${sourceId}`);
          errorToast(steps[1].message, [], toastContext);
          setSetupStep("not-started");
          // keep the form open, let them fix the error and try again
        }
      } else {
        setTimeout(() => {
          checkSourceConnectivityTask(taskId, sourceId, mutator);
        }, 5000);
      }
    } catch (err: any) {
      console.log("failed to get task status, retrying in 5");
      setTimeout(() => {
        checkSourceConnectivityTask(taskId, sourceId, mutator);
      }, 5000);
    }

  }

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <CreateSourceForm
        mutate={mutate}
        showForm={showDialog}
        setShowForm={setShowDialog}
      />
      {
        setupStep === 'creating-source' &&
        <div style={{
          display: 'flex', justifyContent: 'center',
          fontWeight: 'bold', width: '100%',
        }}>Creating Source</div>
      }
      {
        setupStep === 'checking-connectivity' &&
        <div style={{
          display: 'flex', justifyContent: 'center',
          fontWeight: 'bold', width: '100%',
        }}>Checking connectivity...up to 30 seconds</div>
      }
      <List
        openDialog={handleClickOpen}
        title="Source"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
