import { Autocomplete, Box, Button, TextField } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SourceConfigInput } from './SourceConfigInput';

interface EditSourceFormProps {
  showForm: boolean;
  setShowForm: (...args: any) => any;
  sourceId: string;
}

interface SourceApiResponse {
  connectionConfiguration: any;
  icon: string;
  name: string;
  sourceDefinitionId: string;
  sourceId: string;
  sourceName: string;
  workspaceId: string;
}

interface SourceDefinitionsApiResponse {
  sourceDefinitionId: string;
  name: string;
  sourceType: string;
  releaseStage: string;
  protocolVersion: string;
  maxSecondsBetweenMessages: number;
  documentationUrl: string;
  dockerRepository: string;
  dockerImageTag: string;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

const EditSourceForm = ({
  showForm,
  setShowForm,
  sourceId,
}: EditSourceFormProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' },
      config: {},
    },
  });
  const watchSelectedSourceDef = watch('sourceDef');
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<any>>([]);
  const [source, setSource] = useState<any>(null);
  const [sourceDefs, setSourceDefs] = useState<Array<AutoCompleteOption>>([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);

  const handleClose = () => {
    reset();
    setShowForm(false);
    setSource(null);
    setSourceDefs([]);
    setSourceDefSpecs([]);
    setLogs([]);
  };

  useEffect(() => {
    (async () => {
      await fetchSourceDefinitions();
    })();
  }, [showForm]);

  useEffect(() => {
    if (showForm && sourceId && sourceDefs.length === 0) {
      setLoading(true);
      (async () => {
        try {
          const data: SourceApiResponse = await httpGet(
            session,
            `airbyte/sources/${sourceId}`
          );
          setValue('name', data?.name);
          setSource(data);

          for (let idx = 0; idx < sourceDefs.length; idx++) {
            if (sourceDefs[idx].id === source.sourceDefinitionId) {
              setValue('sourceDef', sourceDefs[idx]);
              break;
            }
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
      setLoading(false);
    }
    setLoading(false);
  }, [sourceDefs]);

  const fetchSourceDefinitions = async () => {
    setLoading(true);
    try {
      const data: Array<SourceDefinitionsApiResponse> = await httpGet(
        session,
        'airbyte/source_definitions'
      );
      const sourceDefRows: AutoCompleteOption[] = data?.map(
        (element: SourceDefinitionsApiResponse) => {
          return {
            label: element.name,
            id: element.sourceDefinitionId,
          } as AutoCompleteOption;
        }
      );
      setSourceDefs(sourceDefRows);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

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
          const dataProperties: any = data?.properties || {};
          let maxOrder = -1;

          for (const [key, value] of Object.entries(dataProperties)) {
            const order: any =
              (value as any)?.order >= 0 ? (value as any)?.order : -1;
            specsConfigFields.push({
              airbyte_secret: false,
              ...(value as object),
              field: key,
              required: data?.required.includes(key),
              order: order,
            });
            maxOrder = order > maxOrder ? order : maxOrder;
          }

          // Attach order to all specs
          for (const spec of specsConfigFields) {
            if (spec.order === -1) {
              spec.order = ++maxOrder;
            }
          }
          setSourceDefSpecs(specsConfigFields);

          // Set the edit form prefilled values of the current source
          for (const spec of specsConfigFields) {
            const field: any = `config.${spec.field}`;
            setValue(field, source?.connectionConfiguration[`${spec.field}`]);
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [watchSelectedSourceDef]);

  const editSource = async (data: any) => {
    try {
      await httpPut(session, `airbyte/sources/${source?.sourceId}`, {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      handleClose();
      successToast('Source update', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const checkSourceConnectivityForUpdate = async (data: any) => {
    setLoading(true);
    setLogs([]);
    try {
      const checkResponse = await httpPost(
        session,
        `airbyte/sources/${sourceId}/check_connection_for_update/`,
        {
          name: data.name,
          sourceDefId: data.sourceDef.id,
          config: data.config,
        }
      );
      if (checkResponse.status === 'succeeded') {
        await editSource(data);
        setLoading(false);
      } else {
        setLogs(checkResponse.logs);
        errorToast('Something went wrong', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const onSubmit = async (data: any) => {
    await checkSourceConnectivityForUpdate(data);
  };

  const FormContent = () => {
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
          <>
            <Controller
              name="sourceDef"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  value={field.value}
                  options={sourceDefs}
                  onChange={(e, data) => field.onChange(data)}
                  renderInput={(params) => {
                    return (
                      <TextField
                        {...params}
                        label="Select source type"
                        variant="outlined"
                      />
                    );
                  }}
                />
              )}
            />
            <Box sx={{ m: 2 }} />
            <SourceConfigInput
              specs={sourceDefSpecs}
              registerFormFieldValue={register}
              control={control}
              setFormValue={setValue}
              source={source}
            />
          </>
        </Box>
      </>
    );
  };
  return (
    <CustomDialog
      title={'Edit source'}
      show={showForm}
      handleClose={handleClose}
      handleSubmit={handleSubmit(onSubmit)}
      formContent={<FormContent />}
      formActions={
        <Box>
          <Button variant="contained" type="submit" data-testid="savebutton">
            Save changes and test
          </Button>
          <Button
            color="secondary"
            variant="outlined"
            onClick={handleClose}
            data-testid="cancelbutton"
            sx={{ marginLeft: '5px' }}
          >
            Cancel
          </Button>
          {logs && (
            <Box sx={{ pt: 2, pb: 4, maxWidth: '100%' }}>
              {logs.map((logmessage, idx) => (
                <Box key={idx}>{logmessage}</Box>
              ))}
            </Box>
          )}
        </Box>
      }
      loading={loading || !source}
    />
  );
};

export default EditSourceForm;
