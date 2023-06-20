import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Autocomplete, Box, Button } from '@mui/material';
import { httpGet, httpPost } from '@/helpers/http';
import { Controller, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { SourceConfigInput } from './SourceConfigInput';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import Input from '../UI/Input/Input';

interface CreateSourceFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

const CreateSourceForm = ({
  mutate,
  showForm,
  setShowForm,
}: CreateSourceFormProps) => {
  const { data: session }: any = useSession();
  const [sourceDefs, setSourceDefs] = useState<Array<AutoCompleteOption>>([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const [setupLogs, setSetupLogs] = useState<Array<string>>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const toastContext = useContext(GlobalContext);

  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' } as AutoCompleteOption,
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

  useEffect(() => {
    if (showForm && sourceDefs.length === 0) {
      (async () => {
        try {
          const data = await httpGet(session, 'airbyte/source_definitions');
          const sourceDefRows: Array<AutoCompleteOption> = data?.map(
            (element: any) =>
              ({
                label: element.name,
                id: element.sourceDefinitionId,
              } as AutoCompleteOption)
          );
          setSourceDefs(sourceDefRows);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [showForm]);

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data: any = await httpGet(
            session,
            `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`
          );
          // Prepare the specs config before setting it
          const specsConfigFields: Array<any> = [];
          const dataProperties: any = data?.properties || {};
          let maxOrder = -1;

          // console.log(data.properties);
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
          // console.log('setting source def specs');
          // console.log(specsConfigFields);
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
    await checkSourceConnectivity(data);
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <Input
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
                  return value.id === '' || option.id === value.id;
                }}
                onChange={(e, data) => field.onChange(data)}
                renderInput={(params) => {
                  return (
                    <Input
                      name="sourceDef"
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
          />
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        title={'Add a new source'}
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
