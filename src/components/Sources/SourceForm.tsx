import { Autocomplete, Box, Button } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SourceConfigInput } from './SourceConfigInput';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

interface SourceFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  sourceId: string;
  loading: boolean;
  setLoading: (...args: any) => any;
  sourceDefs: any;
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

type AutoCompleteOption = {
  id: string;
  label: string;
  dockerImageTag: string;
};

type SourceFormInput = {
  name: string;
  sourceDef: null | AutoCompleteOption;
  config: object;
};

const SourceForm = ({
  mutate,
  showForm,
  setShowForm,
  sourceId,
  loading,
  setLoading,
  sourceDefs,
}: SourceFormProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    unregister,
    getValues,
  } = useForm<SourceFormInput>({
    defaultValues: {
      name: '',
      sourceDef: null,
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');
  const [logs, setLogs] = useState<Array<any>>([]);
  const [source, setSource] = useState<any>(null);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const lastRenderedSpecRef = useRef([]);

  const handleClose = () => {
    reset();
    setShowForm(false);
    setSource(null);
    setSourceDefSpecs([]);
    setLogs([]);
  };

  useEffect(() => {
    if (showForm && sourceId && sourceDefs.length > 0) {
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
            if (sourceDefs[idx].id === data.sourceDefinitionId) {
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
  }, [sourceDefs, showForm]);

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`
          );

          const connectorConfigInput = new ConnectorConfigInput('source', data);

          connectorConfigInput.setValidOrderToAllProperties();

          connectorConfigInput.setOrderToChildProperties();

          // Prefill the source config
          if (sourceId) {
            ConnectorConfigInput.prefillFormFields(
              source.connectionConfiguration,
              'config',
              setValue
            );
          }

          // Prepare the specs config before setting it
          let specsConfigFields = connectorConfigInput.prepareSpecsToRender();

          if (sourceId) {
            specsConfigFields = connectorConfigInput.updateSpecsToRender(
              source.connectionConfiguration
            );
          }

          setSourceDefSpecs(specsConfigFields);
          specsConfigFields.forEach((spec: any) =>
            setValue(spec.field, spec.default)
          );
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [watchSelectedSourceDef]);

  const createSource = async (data: any) => {
    try {
      await httpPost(session, 'airbyte/sources/', {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      mutate();
      handleClose();
      successToast('Source added', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const editSource = async (data: any) => {
    try {
      await httpPut(session, `airbyte/sources/${source?.sourceId}`, {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      handleClose();
      successToast('Source updated', [], globalContext);
      mutate();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const checkSourceConnectivityForUpdate = async (data: any) => {
    setLoading(true);
    setLogs([]);
    try {
      let url = `airbyte/sources/check_connection/`;
      if (sourceId) {
        url = `airbyte/sources/${sourceId}/check_connection_for_update/`;
      }
      const checkResponse = await httpPost(session, url, {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });

      if (checkResponse.status === 'succeeded') {
        if (sourceId) {
          await editSource(data);
        } else {
          await createSource(data);
        }

        setLoading(false);
      } else {
        setLogs(checkResponse.logs);
        errorToast('Something went wrong', [], globalContext);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  const onSubmit = async (data: any) => {
    // unregister form fields
    ConnectorConfigInput.syncFormFieldsWithSpecs(
      data,
      lastRenderedSpecRef.current || [],
      unregister
    );

    await checkSourceConnectivityForUpdate(getValues());
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field: { ref, ...rest }, fieldState }) => (
              <Input
                {...rest}
                sx={{ width: '100%' }}
                label="Name*"
                variant="outlined"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              ></Input>
            )}
          />
          <Box sx={{ m: 2 }} />
          <>
            <Controller
              name="sourceDef"
              control={control}
              rules={{ required: 'Source type is required' }}
              render={({ field, fieldState }) => (
                <Autocomplete
                  disabled={!!sourceId}
                  id="sourceDef"
                  data-testid="autocomplete"
                  value={field.value}
                  getOptionLabel={(option) =>
                    `${option.label} (v${option.dockerImageTag})`
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {`${option.label} (v${option.dockerImageTag})`}
                    </li>
                  )}
                  options={sourceDefs}
                  onChange={(e, data) => data && field.onChange(data)}
                  renderInput={(params) => {
                    return (
                      <Input
                        name="sourceDef"
                        {...params}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
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
              unregisterFormField={unregister}
              lastRenderedSpecRef={lastRenderedSpecRef}
            />
          </>
        </Box>
      </>
    );
  };
  return (
    <CustomDialog
      title={sourceId ? 'Edit source' : 'Add a new source'}
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
          {logs && logs.length > 0 && (
            <Box sx={{ pt: 2, pb: 4, maxWidth: '100%' }}>
              {logs.map((logmessage, idx) => (
                <Box key={idx}>{logmessage}</Box>
              ))}
            </Box>
          )}
        </Box>
      }
      loading={loading}
    />
  );
};

export default SourceForm;
