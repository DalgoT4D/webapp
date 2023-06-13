import { Autocomplete, Box, Button, TextField } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { DestinationConfigInput } from './DestinationConfigInput';

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
  } = useForm({
    defaultValues: {
      name: '',
      destinationDef: { id: '', label: '' },
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
                element?.destinationDefinitionId ==
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
          value['oneOf'].forEach((ele: any) => {
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

          // Prefill the warehouse name
          setValue('name', warehouse.name);

          // Prefill the warehouse config
          setPrefilledFormFieldsForWarehouse(
            warehouse.connectionConfiguration,
            'config'
          );
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [watchSelectedDestinationDef]);

  const setPrefilledFormFieldsForWarehouse = (
    connectionConfiguration: any,
    parent = 'config'
  ) => {
    for (const [key, value] of Object.entries(connectionConfiguration)) {
      const field: any = `${parent}.${key}`;

      const valIsObject =
        typeof value === 'object' && value !== null && !Array.isArray(value);

      if (valIsObject) {
        setPrefilledFormFieldsForWarehouse(value, field);
      } else {
        setValue(field, value);
      }
    }
  };

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
        <TextField
          sx={{ width: '100%' }}
          label="Name"
          variant="outlined"
          {...register('name', { required: true })}
        ></TextField>
        <Box sx={{ m: 2 }} />
        <Controller
          name="destinationDef"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <Autocomplete
              options={destinationDefs}
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
        title={'Edit warehouse'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<EditDestinationForm />}
        formActions={
          <Box>
            <Button variant="contained" type="submit">
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

export default EditDestinationForm;
