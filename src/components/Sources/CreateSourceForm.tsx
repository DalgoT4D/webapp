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

type AutoCompleteOption =
  | {
      id: string;
      label: string;
    }
  | undefined;

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
      sourceDef: undefined as AutoCompleteOption,
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

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

    // Todo: need to find a better way to do this
    result = result.map((res: any) => ({ ...res, order: res.order + 1 }));
    result.sort((a: any, b: any) => a.order - b.order);

    return result;
  };

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

          console.log('set these speecs before anything', specsConfigFields);
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
                  return value?.id === '' || option?.id === value?.id;
                }}
                onChange={(e, data) => data && field.onChange(data)}
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
            unregisterFormField={unregister}
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
