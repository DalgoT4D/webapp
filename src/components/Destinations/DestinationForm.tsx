import { Autocomplete, Box, Button } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';
import { ConfigInput } from '../ConfigInput/ConfigInput';

interface DestinationFormProps {
  showForm: boolean;
  setShowForm: (...args: any) => any;
  warehouse?: any;
  mutate: (...args: any) => any;
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

type DestinationFormInput = {
  name: string;
  destinationDef: null | AutoCompleteOption;
  config: object;
};

const DestinationForm = ({
  showForm,
  setShowForm,
  warehouse,
  mutate,
}: DestinationFormProps) => {
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

  const { handleSubmit, control, watch, reset, setValue } =
    useForm<DestinationFormInput>({
      defaultValues: {
        name: '',
        destinationDef: null,
        config: {},
      },
    });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if ((destinationDefs.length === 0 || warehouse) && showForm) {
      (async () => {
        setLoading(true);
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
        setLoading(false);
      })();
    }
  }, [showForm]);

  useEffect(() => {
    if (watchSelectedDestinationDef?.id) {
      (async () => {
        try {
          setLoading(true);
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
          let specsConfigFields: any =
            connectorConfigInput.prepareSpecsToRender();

          if (warehouse) {
            // Prefill the warehouse name
            setValue('name', warehouse.name);
            specsConfigFields = connectorConfigInput.updateSpecsToRender(
              warehouse.connectionConfiguration
            );

            // Prefill the warehouse config
            ConnectorConfigInput.prefillFormFields(
              warehouse.connectionConfiguration,
              'config',
              setValue
            );
          }

          setDestinationDefSpecs(specsConfigFields);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        setLoading(false);
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
      setLoading(true);
      await httpPut(
        session,
        `airbyte/v1/destinations/${warehouse.destinationId}/`,
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
    setLoading(false);
  };

  const createWarehouse = async (data: any) => {
    await httpPost(session, 'organizations/warehouse/', {
      wtype: data.destinationDef.label.toLowerCase(),
      name: data.name,
      destinationDefId: data.destinationDef.id,
      airbyteConfig: {
        ...data.config,
        port: Number(data.config.port),
      },
    });
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      setSetupLogs([]);
      let url = 'airbyte/destinations/check_connection/';
      let params: any = {
        name: data.name,
        destinationDefId: data.destinationDef.id,
        config: {
          ...data.config,
          port: Number(data.config.port),
        },
      };
      if (warehouse) {
        url = `airbyte/destinations/${warehouse.destinationId}/check_connection_for_update/`;
        params = {
          name: data.name,
          config: data.config,
        };
      }

      const connectivityCheck = await httpPost(session, url, params);
      if (connectivityCheck.status === 'succeeded') {
        if (warehouse) {
          await editWarehouse(data);
        } else {
          await createWarehouse(data);
        }
        handleClose();
        mutate();
        successToast(
          warehouse
            ? 'Warehouse details updated successfully'
            : 'Warehouse created',
          [],
          globalContext
        );
      } else {
        console.log(connectivityCheck);
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

  const destinationForm = (
    <Box sx={{ pt: 2, pb: 4 }}>
      <Controller
        name="name"
        control={control}
        rules={{ required: 'Destination type is required' }}
        render={({ field: { ref, ...rest }, fieldState }) => (
          <Input
            {...rest}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            sx={{ width: '100%' }}
            label="Name*"
            variant="outlined"
            data-testid="dest-name"
          ></Input>
        )}
      />
      <Box sx={{ m: 2 }} />
      <Controller
        name="destinationDef"
        control={control}
        rules={{ required: 'Destination type is required' }}
        render={({ field, fieldState }) => (
          <Autocomplete
            disabled={!!warehouse}
            id="destinationDef"
            options={destinationDefs}
            data-testid="dest-type-autocomplete"
            value={field.value}
            onChange={(e, data) => data && field.onChange(data)}
            renderInput={(params) => (
              <Input
                name="destinationDef"
                {...params}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                label="Select destination type"
                variant="outlined"
              />
            )}
          />
        )}
      />
      <Box sx={{ m: 2 }} />
      <ConfigInput
        specs={destinationDefSpecs}
        control={control}
        setFormValue={setValue}
        entity={warehouse}
      />
    </Box>
  );

  return (
    <>
      <CustomDialog
        title={'Edit warehouse'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={destinationForm}
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

export default DestinationForm;
