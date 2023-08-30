import { Autocomplete, Box, Button } from '@mui/material';
import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { DestinationConfigInput } from './DestinationConfigInput';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

interface CreateDestinationFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

type CreateDestinatinFormInput = {
  name: string;
  destinationDef: null | AutoCompleteOption;
  config: object;
};

const CreateDestinationForm = ({
  showForm,
  setShowForm,
  mutate,
}: CreateDestinationFormProps) => {
  const { data: session }: any = useSession();
  const [destinationDefs, setDestinationDefs] = useState<
    Array<AutoCompleteOption>
  >([]);
  const [destinationDefSpecs, setDestinationDefSpecs] = useState<Array<any>>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const globalContext = useContext(GlobalContext);
  const lastRenderedSpecRef = useRef([]);

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
  } = useForm<CreateDestinatinFormInput>({
    defaultValues: {
      name: '',
      destinationDef: null,
      config: {},
    },
  });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if (showForm && destinationDefs.length === 0) {
      (async () => {
        setLoading(true);
        try {
          const data = await httpGet(
            session,
            'airbyte/destination_definitions'
          );
          const destinationDefRows: Array<AutoCompleteOption> = data?.map(
            (element: any) =>
              ({
                label: element.name,
                id: element.destinationDefinitionId,
              } as AutoCompleteOption)
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
        setLoading(true);
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

          const specs = connectorConfigInput.prepareSpecsToRender();

          console.log('setting these specs', specs);
          setDestinationDefSpecs(specs);
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

  const onSubmit = async (data: any) => {
    // unregister form fields
    ConnectorConfigInput.syncFormFieldsWithSpecs(
      data,
      lastRenderedSpecRef.current || [],
      unregister
    );

    // update the data, some form fields might have been unregistered
    data = getValues();

    setLoading(true);
    try {
      setSetupLogs([]);
      const connectivityCheck = await httpPost(
        session,
        'airbyte/destinations/check_connection/',
        {
          name: data.name,
          destinationDefId: data.destinationDef.id,
          config: {
            ...data.config,
            port: Number(data.config.port),
          },
        }
      );
      if (connectivityCheck.status === 'succeeded') {
        await httpPost(session, 'organizations/warehouse/', {
          wtype: data.destinationDef.label.toLowerCase(),
          name: data.name,
          destinationDefId: data.destinationDef.id,
          airbyteConfig: {
            ...data.config,
            port: Number(data.config.port),
          },
        });
        mutate();
        handleClose();
        successToast('Warehouse created', [], globalContext);
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

  const CreateDestinationForm = () => {
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
          lastRenderedSpecRef={lastRenderedSpecRef}
        />
      </Box>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Add a new warehouse'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<CreateDestinationForm />}
        formActions={
          <Box>
            <Button variant="contained" type="submit" data-testid="save-button">
              Save changes and test
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancel-button"
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
        loading={loading}
      />
    </>
  );
};

export default CreateDestinationForm;
