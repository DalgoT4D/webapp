import { Autocomplete, Box, Button } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { DestinationConfigInput } from './DestinationConfigInput';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

interface EditDestinationFormProps {
  showForm: boolean;
  setShowForm: (...args: any) => any;
  warehouse: any;
}

interface DestinationDefinitionsApiResponse {
  destinationDefinitionId: string;
  name: string;
  sourceType: string;
  releaseStage: string;
  protocolVersion: string;
  maxSecondsBetweenMessages: number;
  documentationUrl: string;
  dockerRepository: string;
  dockerImageTag: string;
  normalizationConfig: any;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

type EditDestinatinFormInput = {
  name: string;
  destinationDef: null | AutoCompleteOption;
  config: object;
};

const EditDestinationForm = ({
  showForm,
  setShowForm,
  warehouse,
}: EditDestinationFormProps) => {
  const { data: session }: any = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const [destinationDefSpecs, setDestinationDefSpecs] = useState<Array<any>>(
    []
  );
  const [destinationDefs, setDestinationDefs] = useState<
    Array<{ id: string; label: string }>
  >([]);
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
    formState: { errors },
  } = useForm<EditDestinatinFormInput>({
    defaultValues: {
      name: '',
      destinationDef: null,
      config: {},
    },
  });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if (warehouse && showForm) {
      (async () => {
        try {
          const data: Array<DestinationDefinitionsApiResponse> = await httpGet(
            session,
            'airbyte/destination_definitions'
          );
          const destinationDefRows: { id: string; label: string }[] = data?.map(
            (element: DestinationDefinitionsApiResponse) => {
              if (
                element.destinationDefinitionId ===
                warehouse?.destinationDefinitionId
              ) {
                setValue('destinationDef', {
                  label: element.name,
                  id: element.destinationDefinitionId,
                });
              }

              return {
                label: element.name,
                id: element.destinationDefinitionId,
              };
            }
          );

          setDestinationDefs(destinationDefRows);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [showForm]);

  useEffect(() => {
    if (watchSelectedDestinationDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/destination_definitions/${watchSelectedDestinationDef.id}/specifications`
          );

          const connectorConfigInput = new ConnectorConfigInput(
            'destination',
            data
          );

          connectorConfigInput.setValidOrderToAllProperties();

          connectorConfigInput.setOrderToChildProperties();

          // Prepare the specs config before setting it
          connectorConfigInput.prepareSpecsToRender();

          const specsConfigFields: any =
            connectorConfigInput.updateSpecsToRender(
              warehouse.connectionConfiguration
            );

          // Prefill the warehouse name
          setValue('name', warehouse.name);

          // Prefill the warehouse config
          ConnectorConfigInput.prefillFormFields(
            warehouse.connectionConfiguration,
            'config',
            setValue
          );

          setDestinationDefSpecs(specsConfigFields);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [watchSelectedDestinationDef]);

  const handleClose = () => {
    reset();
    setDestinationDefSpecs([]);
    setShowForm(false);
    setSetupLogs([]);
  };

  const editWarehouse = async (data: any) => {
    try {
      await httpPut(
        session,
        `airbyte/destinations/${warehouse.destinationId}/`,
        {
          name: data.name,
          destinationDefId: data.destinationDef.id,
          config: data.config,
        }
      );
      handleClose();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      setSetupLogs([]);
      const connectivityCheck = await httpPost(
        session,
        `airbyte/destinations/${warehouse.destinationId}/check_connection_for_update/`,
        {
          name: data.name,
          config: data.config,
        }
      );
      if (connectivityCheck.status === 'succeeded') {
        await editWarehouse(data);
        handleClose();
        successToast(
          'Warehouse details updated successfully',
          [],
          globalContext
        );
      } else {
        setSetupLogs(connectivityCheck.logs);
        errorToast('Failed to connect to warehouse', [], globalContext);
      }
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  const EditDestinationForm = () => {
    return (
      <Box sx={{ pt: 2, pb: 4 }}>
        <Input
          error={!!errors.name}
          helperText={errors.name?.message}
          sx={{ width: '100%' }}
          label="Name"
          variant="outlined"
          register={register}
          name="name"
          required
          data-testid="dest-name"
        ></Input>
        <Box sx={{ m: 2 }} />
        <Controller
          name="destinationDef"
          control={control}
          rules={{ required: 'Destination type is required' }}
          render={({ field }) => (
            <Autocomplete
              disabled={true}
              id="destinationDef"
              options={destinationDefs}
              data-testid="dest-type-autocomplete"
              value={field.value}
              onChange={(e, data) => data && field.onChange(data)}
              renderInput={(params) => (
                <Input
                  name="destinationDef"
                  {...params}
                  error={!!errors.destinationDef}
                  helperText={errors.destinationDef?.message}
                  label="Select destination type"
                  variant="outlined"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <DestinationConfigInput
          errors={errors}
          specs={destinationDefSpecs}
          registerFormFieldValue={register}
          control={control}
          setFormValue={setValue}
          unregisterFormField={unregister}
          destination={warehouse}
        />
      </Box>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Edit warehouse'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<EditDestinationForm />}
        formActions={
          <Box>
            <Button variant="contained" type="submit" data-testid="save-button">
              Save changes and test
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancel"
              sx={{ marginLeft: '5px' }}
            >
              Cancel
            </Button>
            {setupLogs.length > 0 && (
              <Box sx={{ pt: 2, pb: 4, maxWidth: '100%' }}>
                {setupLogs.map((logmessage, idx) => (
                  <Box key={idx}>{logmessage}</Box>
                ))}
              </Box>
            )}
          </Box>
        }
        loading={loading}
      />
    </>
  );
};

export default EditDestinationForm;
