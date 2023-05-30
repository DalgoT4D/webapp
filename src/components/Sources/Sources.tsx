import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  TextField,
} from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { SourceConfigInput } from './SourceConfigInput';
import { httpDelete, httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import CustomDialog from '../Dialog/CustomDialog';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [sourceDefs, setSourceDefs] = useState([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const [setupStep, setSetupStep] = useState<string>("not-started");
  const toastContext = useContext(GlobalContext);

  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' },
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
      ]);
      setRows(rows);
    }
  }, [data]);

  useEffect(() => {
    if (showDialog && sourceDefs.length === 0) {
      (async () => {
        try {
          const data = await httpGet(session, 'airbyte/source_definitions');
          const sourceDefRows = data?.map((element: any) => ({
            label: element.name,
            id: element.sourceDefinitionId,
          }));
          setSourceDefs(sourceDefRows);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [showDialog]);

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`
          );
          // Prepare the specs config before setting it
          const specsConfigFields: Array<any> = [];
          for (const [key, value] of Object.entries(data?.properties || {})) {
            specsConfigFields.push({
              airbyte_secret: false,
              ...(value as object),
              field: key,
              required: data?.required.includes(key),
            });
          }
          setSourceDefSpecs(specsConfigFields);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [watchSelectedSourceDef]);

  const handleClose = () => {
    reset();
    setSourceDefSpecs([]);
    setShowDialog(false);
  };

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

  const CreateSourceForm = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <TextField
            sx={{ width: '100%' }}
            label="Name"
            variant="outlined"
            {...register('name', { required: true })}
          ></TextField>
          <Box sx={{ m: 2 }} />
          <Controller
            name="sourceDef"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Autocomplete
                options={sourceDefs}
                onChange={(e, data) => field.onChange(data)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select source type"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <SourceConfigInput
            specs={sourceDefSpecs}
            registerFormFieldValue={register}
            control={control}
            setFormValue={setValue}
          />
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Add a new source'}
        show={showDialog}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<CreateSourceForm />}
        formActions={
          <>
            {
              setupStep === 'not-started' &&
              <>
                <Button variant="contained" type="submit">
                  Save changes and test
                </Button>
                <Button
                  color="secondary"
                  variant="outlined"
                  onClick={handleClose}
                  data-testid="cancel"
                >
                  Cancel
                </Button>
              </>
            }
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
          </>
        }
      ></CustomDialog>
      <List
        openDialog={handleClickOpen}
        title="Source"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
