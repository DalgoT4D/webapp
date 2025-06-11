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
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const { sendJsonMessage, lastMessage } = useWebSocket(socketUrl, {
    share: false,
    onError(event) {
      console.error('Socket error:', event);
    },
  });

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
            const defaultConfig: Record<string, any> = {};

            // First pass: collect all default values
            const collectDefaults = (properties: Record<string, any>) => {
              Object.entries(properties).forEach(([key, value]) => {
                if (value.type === 'object' && value.properties) {
                  defaultConfig[key] = {};
                  collectDefaults(value.properties);
                } else if (value.default !== undefined) {
                  defaultConfig[key] =
                    value.type === 'integer' || value.type === 'number'
                      ? Number(value.default)
                      : value.default;
                } else if (value.required) {
                  // Set empty values for required fields
                  switch (value.type) {
                    case 'integer':
                    case 'number':
                      defaultConfig[key] = value.minimum || 0;
                      break;
                    case 'string':
                      defaultConfig[key] = '';
                      break;
                    case 'object':
                      defaultConfig[key] = {};
                      break;
                    case 'array':
                      defaultConfig[key] = [];
                      break;
                  }
                }
              });
            };

            if (data.connectionSpecification?.properties) {
              collectDefaults(data.connectionSpecification.properties);
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

  const handleSaveSource = async () => {
    if (!pendingFormData) return;

    const formData = {
      name: pendingFormData.name,
      sourceDefId: pendingFormData.sourceDef?.id,
      config: pendingFormData.config,
    };

    try {
      if (sourceId) {
        await httpPut(session, `airbyte/sources/${source?.sourceId}`, formData);
        successToast('Source updated', [], globalContext);
      } else {
        await httpPost(session, 'airbyte/sources/', formData);
        successToast('Source added', [], globalContext);
      }
      mutate();
      handleClose(); // Only reset form on successful save
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
      setLoading(false);
      setPendingFormData(null); // Clear pending data but keep form state
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
      config: data.config,
      sourceId: sourceId,
    });
  };

  const formContent = (
    <FormProvider {...methods}>
      <Box sx={{ pt: 2, pb: 4 }}>
        <Input
          name="name"
          control={control}
          rules={{ required: 'Name is required' }}
          sx={{ width: '100%', mb: 2 }}
          label="Name*"
          variant="outlined"
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
