import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Autocomplete, Box, Button, CircularProgress } from '@mui/material';
import { httPut, httpPost } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { SourceConfigInput } from './SourceConfigInput';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import Input from '../UI/Input/Input';
import useSWR from 'swr';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';
import { backendUrl } from '@/config/constant';

interface SourceFormProps {
  sourceId?: string | undefined;
  mutate: (...args: any) => any;
  setShowForm: (...args: any) => any;
}

type AutoCompleteOption =
  | {
      id: string;
      label: string;
    }
  | undefined;

const SourceForm = ({ mutate, setShowForm, sourceId }: SourceFormProps) => {
  const { data: session }: any = useSession();
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const toastContext = useContext(GlobalContext);
  const { data } = useSWR(`${backendUrl}/api/airbyte/source_definitions`);

  const { data: sourceData } = useSWR(
    sourceId ? `${backendUrl}/api/airbyte/sources/${sourceId}` : null
  );

  const sourceDefs: Array<AutoCompleteOption> = data
    ? data?.map(
        (element: any) =>
          ({
            label: element.name,
            id: element.sourceDefinitionId,
          } as AutoCompleteOption)
      )
    : [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    unregister,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      sourceDef: undefined as AutoCompleteOption,
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

  const { data: specifications } = useSWR(
    watchSelectedSourceDef?.id
      ? `${backendUrl}/api/airbyte/source_definitions/${watchSelectedSourceDef?.id}/specifications`
      : null
  );

  useEffect(() => {
    if (specifications) {
      const connectorConfigInput = new ConnectorConfigInput(
        'source',
        specifications
      );
      connectorConfigInput.setValidOrderToAllProperties();
      connectorConfigInput.setOrderToChildProperties();
      const specs = connectorConfigInput.prepareSpecsToRender();

      setSourceDefSpecs(specs);
    }
  }, [specifications]);

  useEffect(() => {
    if (sourceData && data && !specifications) {
      setValue('name', sourceData?.name);

      for (let idx = 0; idx < sourceDefs.length; idx++) {
        if (sourceDefs[idx]?.id === sourceData.sourceDefinitionId) {
          setValue('sourceDef', sourceDefs[idx]);
          break;
        }
      }
    }
    if (sourceData && data && specifications) {
      const connectorConfigInput = new ConnectorConfigInput(
        'source',
        specifications
      );

      connectorConfigInput.setValidOrderToAllProperties();
      connectorConfigInput.setOrderToChildProperties();
      ConnectorConfigInput.prefillFormFields(
        sourceData.connectionConfiguration,
        'config',
        setValue
      );
      connectorConfigInput.prepareSpecsToRender();

      const specsConfigFields: any = connectorConfigInput.updateSpecsToRender(
        sourceData.connectionConfiguration
      );

      setSourceDefSpecs(specsConfigFields);
    }
  }, [sourceData, data, specifications]);

  const handleClose = () => {
    reset();
    setSourceDefSpecs([]);
    setShowForm(false);
    setSetupLogs([]);
    setChecking(false);
  };

  const checkSourceConnectivity = async (data: any) => {
    setChecking(true);
    setSetupLogs([]);
    try {
      const checkResponse = await httpPost(
        session,
        `airbyte/sources/check_connection/`,
        {
          name: data.name,
          sourceDefId: data.sourceDef.id,
          config: data.config,
        }
      );
      if (checkResponse.status === 'succeeded') {
        await createOrUpdateSource(data);
      } else {
        errorToast('Something went wrong', [], toastContext);
        setSetupLogs(checkResponse.logs);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
    setChecking(false);
  };

  const createOrUpdateSource = async (data: any) => {
    try {
      if (sourceId) {
        await httPut(session, `airbyte/sources/${sourceData?.sourceId}`, {
          name: data.name,
          sourceDefId: data.sourceDef.id,
          config: data.config,
        });
      } else {
        await httpPost(session, 'airbyte/sources/', {
          name: data.name,
          sourceDefId: data.sourceDef.id,
          config: data.config,
        });
      }
      mutate();
      handleClose();
      successToast(
        sourceId ? 'Source updated' : 'Source added',
        [],
        toastContext
      );
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const onSubmit = async (data: any) => {
    await checkSourceConnectivity(data);
  };

  const formContent =
    sourceId && !watchSelectedSourceDef ? (
      <CircularProgress />
    ) : (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <Input
            error={!!errors.name}
            helperText={errors.name?.message}
            sx={{ width: '100%' }}
            label="Name"
            variant="outlined"
            required
            register={register}
            name="name"
          ></Input>
          <Box sx={{ m: 2 }} />

          <Controller
            name="sourceDef"
            control={control}
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <Autocomplete
                disabled={!!sourceId}
                id="sourceDef"
                data-testid="autocomplete"
                value={value}
                options={sourceDefs}
                isOptionEqualToValue={(
                  option: AutoCompleteOption,
                  value: AutoCompleteOption
                ) => value?.id === '' || option?.id === value?.id}
                onChange={(e, data) => data && onChange(data)}
                renderInput={(params) => (
                  <Input
                    name="sourceDef"
                    {...params}
                    error={!!errors.sourceDef}
                    helperText={errors.sourceDef?.message}
                    label="Select source type"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <SourceConfigInput
            errors={errors}
            specs={sourceDefSpecs}
            registerFormFieldValue={register}
            control={control}
            setFormValue={setValue}
            unregisterFormField={unregister}
          />
        </Box>
      </>
    );

  return (
    <>
      <CustomDialog
        show
        title={sourceId ? 'Edit source' : 'Add a new source'}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={formContent}
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
            {setupLogs && setupLogs.length > 0 && (
              <Box sx={{ pt: 2, pb: 4, maxWidth: '100%' }}>
                {setupLogs.map((logmessage, idx) => (
                  <Box key={idx}>{logmessage}</Box>
                ))}
              </Box>
            )}
          </Box>
        }
        loading={checking}
      ></CustomDialog>
    </>
  );
};

export default SourceForm;
