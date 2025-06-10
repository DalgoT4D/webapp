import React, { useContext, useEffect, useState } from 'react';
import { Autocomplete, Box, Button } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
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

  const { handleSubmit, setValue, watch, reset, control } = useForm<SourceFormState>({
    defaultValues: {
      name: '',
      sourceDef: null,
      config: {},
    },
  });

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
    if (selectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `airbyte/source_definitions/${selectedSourceDef.id}/specifications`
          );
          setSourceSpec(data);

          // Set initial config values if editing
          if (source?.connectionConfiguration) {
            setValue('config', source.connectionConfiguration);
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [selectedSourceDef, session, source, setValue, globalContext]);

  // Handle WebSocket response
  useEffect(() => {
    if (lastMessage) {
      const checkResponse = JSON.parse(lastMessage.data);

      if (checkResponse.status !== 'success') {
        errorToast(checkResponse.message, [], globalContext);
        setLoading(false);
        return;
      }

      if (checkResponse.data.status === 'succeeded') {
        handleSaveSource();
      } else {
        setLogs(checkResponse.data.logs);
        errorToast('Something went wrong', [], globalContext);
        setLoading(false);
      }
    }
  }, [lastMessage]);

  const handleClose = () => {
    reset();
    setShowForm(false);
    setSource(null);
    setSourceSpec(null);
    setLogs([]);
  };

  const handleSaveSource = async () => {
    const formData = {
      name: watch('name'),
      sourceDefId: selectedSourceDef?.id,
      config: watch('config'),
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
      handleClose();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SourceFormState) => {
    // Additional validation for sourceDef
    if (!data.sourceDef) {
      // This should be caught by react-hook-form validation, but let's be extra sure
      return;
    }

    setLoading(true);
    setLogs([]);
    sendJsonMessage({
      name: data.name,
      sourceDefId: data.sourceDef?.id,
      config: data.config,
      sourceId: sourceId,
    });
  };

  const formContent = (
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
              <Input
                {...params}
                name="sourceDef"
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

      {sourceSpec && (
        <ConfigForm
          spec={sourceSpec}
          initialValues={source?.connectionConfiguration} // empty object {} (creating new source) but values (editing a source).
          onChange={(values) => setValue('config', values)}
        />
      )}

      {logs.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {logs.map((log, idx) => (
            <Box key={idx}>{log}</Box>
          ))}
        </Box>
      )}
    </Box>
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
