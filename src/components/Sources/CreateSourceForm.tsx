import React, { useContext, useEffect, useRef, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Autocomplete, Box, Button } from '@mui/material';
import { httpGet, httpPost } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { SourceConfigInput } from './SourceConfigInput';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

interface CreateSourceFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  sourceDefs: any;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

type CreateSourceFormInput = {
  name: string;
  sourceDef: null | AutoCompleteOption;
  config: object;
};

const CreateSourceForm = ({
  mutate,
  showForm,
  setShowForm,
  sourceDefs,
}: CreateSourceFormProps) => {
  const { data: session }: any = useSession();

  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const lastRenderedSpecRef = useRef([]);
  const toastContext = useContext(GlobalContext);

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
  } = useForm<CreateSourceFormInput>({
    defaultValues: {
      name: '',
      sourceDef: null,
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data: any = await httpGet(
            session,
            `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`
          );

          const connectorConfigInput = new ConnectorConfigInput(
            'destination',
            data
          );

          connectorConfigInput.setValidOrderToAllProperties();

          connectorConfigInput.setOrderToChildProperties();

          const specs = connectorConfigInput.prepareSpecsToRender();

          setSourceDefSpecs(specs);
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
        await createSource(data);
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

  const createSource = async (data: any) => {
    try {
      await httpPost(session, 'airbyte/sources/', {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      mutate();
      handleClose();
      successToast('Source added', [], toastContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  const onSubmit = async (data: any) => {
    // unregister form fields
    ConnectorConfigInput.syncFormFieldsWithSpecs(
      data,
      lastRenderedSpecRef.current || [],
      unregister
    );

    await checkSourceConnectivity(getValues());
  };

  const formContent = (
    <>
      <Box sx={{ pt: 2, pb: 4 }} data-testid="create-source-dialog">
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
          rules={{ required: 'Source type is required' }}
          render={({ field }) => (
            <Autocomplete
              id="sourceDef"
              data-testid="autocomplete"
              value={field.value}
              options={sourceDefs}
              isOptionEqualToValue={(
                option: AutoCompleteOption,
                value: AutoCompleteOption
              ) => {
                return value?.id === '' || option?.id === value?.id;
              }}
              onChange={(e, data) => data && field.onChange(data)}
              renderInput={(params) => {
                return (
                  <Input
                    name="sourceDef"
                    {...params}
                    error={!!errors.sourceDef}
                    helperText={errors.sourceDef?.message}
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
          errors={errors}
          specs={sourceDefSpecs}
          registerFormFieldValue={register}
          control={control}
          setFormValue={setValue}
          unregisterFormField={unregister}
          lastRenderedSpecRef={lastRenderedSpecRef}
        />
      </Box>
    </>
  );

  return (
    <>
      <CustomDialog
        title={'Add a new source'}
        show={showForm}
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

export default CreateSourceForm;
