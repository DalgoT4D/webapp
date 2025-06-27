import React, { useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { useForm, Controller, FormProvider } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import useWebSocket from 'react-use-websocket';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { generateWebsocketUrl } from '@/helpers/websocket';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import CustomDialog from '@/components/Dialog/CustomDialog';
import Input from '@/components/UI/Input/Input';
import { ConfigForm } from '../../helpers/connectorConfig/ConfigForm';
import { useWebSocketConnection } from '@/customHooks/useWebsocketConnection';

interface SourceData {
  sourceId: string;
  name: string;
  sourceDefinitionId: string;
  connectionConfiguration: Record<string, any>;
}

interface SourceFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  sourceId: string;
  loading: boolean;
  setLoading: (...args: any) => any;
  sourceDefs: any[];
}

interface SourceFormState {
  name: string;
  sourceDef: null | { id: string; label: string; dockerImageTag: string };
  config: Record<string, any>;
}

export const SourceForm: React.FC<SourceFormProps> = ({
  mutate,
  showForm,
  setShowForm,
  sourceId,
  loading,
  setLoading,
  sourceDefs,
}) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const [source, setSource] = useState<SourceData | null>(null); /// Holds the current source data when editing.
  const [sourceSpec, setSourceSpec] = useState<any>(null); // Holds the source specification for the selected source when editing and creating too..
  const [logs, setLogs] = useState<string[]>([]);
  const [pendingFormData, setPendingFormData] = useState<SourceFormState | null>(null);

  // Helper function to recursively set form values
  const setNestedFormValues = (config: Record<string, any>) => {
    // First set all top-level fields
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        setValue(`config.${key}`, value);
      }
    });

    // Then set object fields with their nested values
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        setValue(`config.${key}`, value);
      }
    });
  };

  const methods = useForm<SourceFormState>({
    defaultValues: {
      name: '',
      sourceDef: null,
      config: {},
    },
    mode: 'onChange', // Enable validation on change
  });

  const { handleSubmit, setValue, watch, reset, control } = methods;

  const selectedSourceDef = watch('sourceDef');

  // WebSocket setup for check connection.
  const { sendJsonMessage, lastMessage, setSocketUrl } = useWebSocketConnection(null);

  useEffect(() => {
    if (session) {
      setSocketUrl(generateWebsocketUrl('airbyte/source/check_connection', session));
    }
  }, [session]);

  // Load existing source data during EDIT.
  useEffect(() => {
    if (showForm && sourceId && sourceDefs.length > 0) {
      setLoading(true);
      (async () => {
        try {
          const data = await httpGet(session, `airbyte/sources/${sourceId}`);
          // Reset form before setting new values
          reset({
            name: '',
            sourceDef: null,
            config: {},
          });
          setValue('name', data?.name);
          setSource(data);

          const matchingSourceDef = sourceDefs.find((def) => def.id === data.sourceDefinitionId);
          if (matchingSourceDef) {
            setValue('sourceDef', matchingSourceDef);
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [sourceDefs, showForm, sourceId]);

  // Load source specification when source type changes
  useEffect(() => {
    let mounted = true;

    if (selectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/source_definitions/${selectedSourceDef.id}/specifications`
          );

          if (!mounted) return;

          setSourceSpec(data);
          console.log('Spec Data:', data.connectionSpecification); // Debug log

          // Set initial config values if editing
          if (source?.connectionConfiguration) {
            // Reset config before setting new values
            setValue('config', {});
            setNestedFormValues(source.connectionConfiguration);
          } else {
            // For new source, set default values from the spec
            const collectDefaults = (
              properties: Record<string, any>,
              target: Record<string, any>,
              requiredFields: string[] = []
            ) => {
              Object.entries(properties).forEach(([key, value]) => {
                const isRequired = requiredFields.includes(key);

                if (value.type === 'object' && value.properties) {
                  target[key] = {};
                  // Pass down the required fields array from the nested object
                  collectDefaults(
                    value.properties,
                    target[key],
                    Array.isArray(value.required) ? value.required : []
                  );
                } else if (value.default !== undefined) {
                  target[key] =
                    value.type === 'integer' || value.type === 'number'
                      ? Number(value.default)
                      : value.default;
                } else if (isRequired) {
                  // Set empty values for required fields
                  switch (value.type) {
                    case 'integer':
                    case 'number':
                      target[key] = value.minimum || 0;
                      break;
                    case 'string':
                      target[key] = '';
                      break;
                    case 'object':
                      target[key] = {};
                      break;
                    case 'array':
                      target[key] = [];
                      break;
                  }
                }
              });
            };

            if (data.connectionSpecification?.properties) {
              const defaultConfig: Record<string, any> = {};
              // Pass the top-level required fields array
              collectDefaults(
                data.connectionSpecification.properties,
                defaultConfig,
                Array.isArray(data.connectionSpecification.required)
                  ? data.connectionSpecification.required
                  : []
              );
              console.log('Default Config:', defaultConfig); // Debug log

              // Set the entire config object at once
              setValue('config', defaultConfig, {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
              });
            }
          }
        } catch (err: any) {
          console.error(err);
          if (mounted) {
            errorToast(err.message, [], globalContext);
          }
        }
      })();
    } else {
      // Clear source spec when no source type is selected
      setSourceSpec(null);
      setValue('config', {});
    }

    return () => {
      mounted = false;
    };
  }, [selectedSourceDef, session, source, setValue, globalContext]);

  // Handle WebSocket response
  useEffect(() => {
    if (lastMessage) {
      const checkResponse = JSON.parse(lastMessage.data);

      if (checkResponse.status !== 'success') {
        errorToast(checkResponse.message, [], globalContext);
        setLoading(false);
        // Don't reset form on validation failure
        setPendingFormData(null);
        return;
      }

      if (checkResponse.data.status === 'succeeded') {
        handleSaveSource();
      } else {
        setLogs(checkResponse.data.logs);
        errorToast('Something went wrong', [], globalContext);
        setLoading(false);
        // Don't reset form on validation failure
        setPendingFormData(null);
      }
    }
  }, [lastMessage]);

  const handleClose = () => {
    // Reset all form fields to their initial state
    reset({
      name: '',
      sourceDef: null,
      config: {},
    });
    setShowForm(false);
    setSource(null);
    setSourceSpec(null);
    setLogs([]);
    setPendingFormData(null);
  };

  // Add cleanup effect when sourceId changes
  useEffect(() => {
    // Reset form when sourceId changes (including when it becomes undefined/null)
    if (!sourceId) {
      reset({
        name: '',
        sourceDef: null,
        config: {},
      });
      setSource(null);
      setSourceSpec(null);
      setPendingFormData(null); // Reset pending form data
    }
  }, [sourceId, reset]);

  // Helper function to clean config by removing empty start_date
  const cleanConfig = (config: Record<string, any>): Record<string, any> => {
    const cleaned = { ...config };

    // Remove start_date if it's empty or null
    if (
      cleaned.start_date === '' ||
      cleaned.start_date === null ||
      cleaned.start_date === undefined
    ) {
      delete cleaned.start_date;
    }

    return cleaned;
  };

  const handleSaveSource = async () => {
    if (!pendingFormData) return;

    const formData = {
      name: pendingFormData.name,
      sourceDefId: pendingFormData.sourceDef?.id,
      config: cleanConfig(pendingFormData.config), // Clean the config before sending
    };

    try {
      setLoading(true);
      if (sourceId) {
        await httpPut(session, `airbyte/sources/${sourceId}`, formData);
        successToast('Source updated', [], globalContext);
      } else {
        await httpPost(session, 'airbyte/sources/', formData);
        successToast('Source created', [], globalContext);
      }
      mutate();
      setLoading(false);
      handleClose();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SourceFormState) => {
    console.log('Form Data on Submit:', data); // Debug log
    // Additional validation for sourceDef
    if (!data.sourceDef) {
      return;
    }

    setLoading(true);
    setLogs([]);
    setPendingFormData(data);
    sendJsonMessage({
      name: data.name,
      sourceDefId: data.sourceDef?.id,
      config: cleanConfig(data.config), // Clean the config before sending
      sourceId: sourceId,
    });
  };

  const formContent = (
    <FormProvider {...methods}>
      <Box sx={{ pt: 2, pb: 4 }}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Name is required' }}
          render={({ field: { ref, ...rest }, fieldState: { error } }) => (
            <Input
              {...rest}
              error={!!error}
              helperText={error?.message}
              sx={{ width: '100%', mb: 2 }}
              label="Name*"
              variant="outlined"
            />
          )}
        />
        {/* select the source type */}
        <Controller
          name="sourceDef"
          control={control}
          rules={{ required: 'Source type is required' }}
          render={({ field, fieldState }) => (
            <Autocomplete
              disabled={!!sourceId}
              value={field.value}
              onChange={(_, value) => field.onChange(value)}
              options={sourceDefs}
              getOptionLabel={(option) => `${option.label} (v${option.dockerImageTag})`}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {`${option.label} (v${option.dockerImageTag})`}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select source type*"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          )}
        />

        {sourceSpec && <ConfigForm spec={sourceSpec} />}

        {logs.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {logs.map((log, idx) => (
              <Box key={idx}>{log}</Box>
            ))}
          </Box>
        )}
      </Box>
    </FormProvider>
  );

  return (
    <CustomDialog
      title={sourceId ? 'Edit source' : 'Add a new source'}
      show={showForm}
      handleClose={handleClose}
      handleSubmit={handleSubmit(onSubmit)}
      formContent={formContent}
      formActions={
        <Box>
          <Button variant="contained" type="submit">
            Save changes and test
          </Button>
          <Button color="secondary" variant="outlined" onClick={handleClose} sx={{ ml: 1 }}>
            Cancel
          </Button>
        </Box>
      }
      loading={loading}
    />
  );
};
