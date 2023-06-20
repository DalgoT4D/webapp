import { Autocomplete, Box, Button, TextField } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { DestinationConfigInput } from './DestinationConfigInput';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';

interface CreateDestinationFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type AutoCompleteOption = {
  id: string;
  label: string;
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    unregister,
  } = useForm({
    defaultValues: {
      name: '',
      destinationDef: { id: '', label: '' } as AutoCompleteOption,
      config: {},
    },
  });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if (showForm && destinationDefs.length === 0) {
      (async () => {
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
      })();
    }
  }, [showForm]);

  const prePrepareConfigSpecs = (
    result: any,
    data: any,
    parent = 'parent',
    exclude: any[] = [],
    dropdownEnums: any[] = []
  ) => {
    // Push the parent enum in the array
    if (exclude.length > 0) {
      if (exclude[0] in data?.properties) {
        dropdownEnums.push(data?.properties[exclude[0]]?.const);
      }
    }

    for (const [key, value] of Object.entries<any>(data?.properties || {})) {
      // The parent oneOf key has already been added to the array
      if (exclude.includes(key)) continue;

      const objParentKey = `${parent}.${key}`;

      if (value?.type === 'object') {
        let commonField: string[] = [];

        // Find common property among all array elements of 'oneOf' array
        if (value['oneOf'] && value['oneOf'].length > 1) {
          value['oneOf']?.forEach((ele: any) => {
            if (commonField.length > 0) {
              commonField = ele?.required.filter((value: any) =>
                commonField.includes(value)
              );
            } else {
              commonField = ele?.required;
            }
          });
        }

        const objResult = {
          field: `${objParentKey}.${commonField}`,
          type: value?.type,
          order: value?.order,
          title: value?.title,
          description: value?.description,
          parent:
            dropdownEnums.length > 0
              ? dropdownEnums[dropdownEnums.length - 1]
              : '',
          enum: [],
          specs: [],
        };

        result.push(objResult);

        value?.oneOf.forEach((eachEnum: any) => {
          prePrepareConfigSpecs(
            objResult.specs,
            eachEnum,
            objParentKey,
            commonField,
            objResult.enum
          );
        });

        continue;
      }

      result.push({
        ...value,
        field: objParentKey,
        parent:
          dropdownEnums.length > 0
            ? dropdownEnums[dropdownEnums.length - 1]
            : '',
        required: data?.required.includes(key),
      });
    }

    return result;
  };

  useEffect(() => {
    if (watchSelectedDestinationDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/destination_definitions/${watchSelectedDestinationDef.id}/specifications`
          );

          const dataProperties: any = data?.properties || {};
          let maxOrder = -1;

          for (const [key, value] of Object.entries(dataProperties)) {
            const order: any =
              (value as any)?.order >= 0 ? (value as any)?.order : -1;
            data.properties[key]['order'] = order;
            maxOrder = order > maxOrder ? order : maxOrder;
          }

          // Attach order to all specs
          for (const key in dataProperties) {
            if (data.properties[key]['order'] === -1)
              data.properties[key]['order'] = ++maxOrder;
          }

          // Prepare the specs config before setting it
          const specsConfigFields = prePrepareConfigSpecs(
            [],
            data,
            'config',
            [],
            []
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
    console.log('here in close form');
    reset();
    setDestinationDefSpecs([]);
    setShowForm(false);
    setSetupLogs([]);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      setSetupLogs([]);
      const connectivityCheck = await httpPost(
        session,
        'airbyte/destinations/check_connection/',
        {
          name: data.name,
          destinationDefId: data.destinationDef.id,
          config: data.config,
        }
      );
      if (connectivityCheck.status === 'succeeded') {
        await httpPost(session, 'organizations/warehouse/', {
          wtype: data.destinationDef.label.toLowerCase(),
          name: data.name,
          destinationDefId: data.destinationDef.id,
          airbyteConfig: data.config,
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
        <TextField
          sx={{ width: '100%' }}
          label="Name"
          variant="outlined"
          {...register('name', { required: true })}
          data-testid="dest-name"
        ></TextField>
        <Box sx={{ m: 2 }} />
        <Controller
          name="destinationDef"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Autocomplete
              options={destinationDefs}
              data-testid="dest-type-autocomplete"
              value={field.value}
              onChange={(e, data) => field.onChange(data)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select destination type"
                  variant="outlined"
                />
              )}
            />
          )}
        />
        <Box sx={{ m: 2 }} />
        <DestinationConfigInput
          specs={destinationDefSpecs}
          registerFormFieldValue={register}
          control={control}
          setFormValue={setValue}
          unregisterFormField={unregister}
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
            {setupLogs && (
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
