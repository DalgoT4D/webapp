import { Autocomplete, Box, Button } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SourceConfigInput } from './SourceConfigInput';
import Input from '../UI/Input/Input';
import ConnectorConfigInput from '@/helpers/ConnectorConfigInput';

interface EditSourceFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  sourceId: string;
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

interface SourceDefinitionsApiResponse {
  sourceDefinitionId: string;
  name: string;
  sourceType: string;
  releaseStage: string;
  protocolVersion: string;
  maxSecondsBetweenMessages: number;
  documentationUrl: string;
  dockerRepository: string;
  dockerImageTag: string;
}

type AutoCompleteOption = {
  id: string;
  label: string;
};

const EditSourceForm = ({
  mutate,
  showForm,
  setShowForm,
  sourceId,
}: EditSourceFormProps) => {
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
  } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' },
      config: {},
    },
  });
  const watchSelectedSourceDef = watch('sourceDef');
  const [loading, setLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<Array<any>>([]);
  const [source, setSource] = useState<any>(null);
  const [sourceDefs, setSourceDefs] = useState<Array<AutoCompleteOption>>([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);

  const handleClose = () => {
    reset();
    setShowForm(false);
    setSource(null);
    setSourceDefs([]);
    setSourceDefSpecs([]);
    setLogs([]);
  };

  useEffect(() => {
    (async () => {
      await fetchSourceDefinitions();
    })();
  }, [showForm]);

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
  }, [sourceDefs]);

  const fetchSourceDefinitions = async () => {
    setLoading(true);
    try {
      const data: Array<SourceDefinitionsApiResponse> = await httpGet(
        session,
        'airbyte/source_definitions'
      );
      const sourceDefRows: AutoCompleteOption[] = data?.map(
        (element: SourceDefinitionsApiResponse) => {
          return {
            label: element.name,
            id: element.sourceDefinitionId,
          } as AutoCompleteOption;
        }
      );
      setSourceDefs(sourceDefRows);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  // const prePrepareConfigSpecs = (
  //   result: any,
  //   data: any,
  //   parent = 'parent',
  //   exclude: any[] = [],
  //   dropdownEnums: any[] = [],
  //   formValues: any = {},
  //   childSpecsBeingEdited: any[] = [],
  //   parentOrder = 0
  // ) => {
  //   // Push the parent enum in the array
  //   if (exclude.length > 0) {
  //     if (exclude[0] in data?.properties) {
  //       dropdownEnums.push(data?.properties[exclude[0]]?.const);
  //     }
  //   }

  //   for (const [key, value] of Object.entries<any>(data?.properties || {})) {
  //     // The parent oneOf key has already been added to the array
  //     if (exclude.includes(key)) continue;

  //     const objParentKey = `${parent}.${key}`;

  //     if (value?.type === 'object') {
  //       let commonField: string[] = [];

  //       // Find common property among all array elements of 'oneOf' array
  //       if (value['oneOf'] && value['oneOf'].length > 1) {
  //         value['oneOf'].forEach((ele: any) => {
  //           if (commonField.length > 0) {
  //             commonField = ele?.required.filter((value: any) =>
  //               commonField.includes(value)
  //             );
  //           } else {
  //             commonField = ele?.required;
  //           }
  //         });
  //       }

  //       const objResult = {
  //         field: `${objParentKey}.${commonField}`,
  //         type: value?.type,
  //         order: value?.order,
  //         title: value?.title,
  //         description: value?.description,
  //         parent:
  //           dropdownEnums.length > 0
  //             ? dropdownEnums[dropdownEnums.length - 1]
  //             : '',
  //         enum: [],
  //         specs: [],
  //       };

  //       result.push(objResult);

  //       value?.oneOf.forEach((eachEnum: any) => {
  //         prePrepareConfigSpecs(
  //           objResult.specs,
  //           eachEnum,
  //           objParentKey,
  //           commonField,
  //           objResult.enum,
  //           formValues,
  //           childSpecsBeingEdited,
  //           value?.order
  //         );
  //       });

  //       continue;
  //     }

  //     // Check if the field is being edited for not; only for nested creds
  //     const levels = objParentKey.split('.');
  //     if (levels.length > 2) {
  //       let prefilled = false;
  //       let levelData = formValues;
  //       for (const level of levels) {
  //         if (level in levelData) {
  //           prefilled = true;
  //           levelData = levelData[level];
  //         } else {
  //           prefilled = false;
  //           break;
  //         }
  //       }
  //       if (prefilled) {
  //         childSpecsBeingEdited.push({
  //           ...value,
  //           order: value?.order >= 0 ? value?.order : parentOrder,
  //           field: objParentKey,
  //           parent:
  //             dropdownEnums.length > 0
  //               ? dropdownEnums[dropdownEnums.length - 1]
  //               : '',
  //           required: data?.required.includes(key),
  //         });
  //       }
  //     }

  //     // Populate the main specs array
  //     result.push({
  //       ...value,
  //       order: value?.order >= 0 ? value?.order : parentOrder,
  //       field: objParentKey,
  //       parent:
  //         dropdownEnums.length > 0
  //           ? dropdownEnums[dropdownEnums.length - 1]
  //           : '',
  //       required: data?.required.includes(key),
  //     });
  //   }

  //   return result;
  // };

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`
          );

          let connectorConfigInput = new ConnectorConfigInput('source', data);

          connectorConfigInput.setValidOrderToAllProperties();

          connectorConfigInput.setOrderToChildProperties();

          // Prefill the source config
          ConnectorConfigInput.prefillFormFields(
            source.connectionConfiguration,
            'config',
            setValue
          );

          // Prepare the specs config before setting it
          connectorConfigInput.prepareSpecsToRender();

          const specsConfigFields: any =
            connectorConfigInput.updateSpecsToRender(
              source.connectionConfiguration
            );

          setSourceDefSpecs(specsConfigFields);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [watchSelectedSourceDef]);

  const editSource = async (data: any) => {
    try {
      await httpPut(session, `airbyte/sources/${source?.sourceId}`, {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      handleClose();
      successToast('Source update', [], globalContext);
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
      const checkResponse = await httpPost(
        session,
        `airbyte/sources/${sourceId}/check_connection_for_update/`,
        {
          name: data.name,
          sourceDefId: data.sourceDef.id,
          config: data.config,
        }
      );
      if (checkResponse.status === 'succeeded') {
        await editSource(data);
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
    await checkSourceConnectivityForUpdate(data);
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <Input
            sx={{ width: '100%' }}
            label="Name"
            variant="outlined"
            register={register}
            name="name"
            required
          ></Input>
          <Box sx={{ m: 2 }} />
          <>
            <Controller
              name="sourceDef"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  disabled={true}
                  id="sourceDef"
                  value={field.value}
                  options={sourceDefs}
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
              source={source}
              unregisterFormField={unregister}
            />
          </>
        </Box>
      </>
    );
  };
  return (
    <CustomDialog
      title={'Edit source'}
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
      loading={loading || !source}
    />
  );
};

export default EditSourceForm;
