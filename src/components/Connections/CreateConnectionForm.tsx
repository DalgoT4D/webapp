import React, { useContext, useEffect, useState } from 'react';
import useSWR from 'swr';
import CustomDialog from '../Dialog/CustomDialog';
import { Autocomplete, Box, Button, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';

interface CreateConnectionFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

const CreateConnectionForm = ({
  mutate,
  showForm,
  setShowForm,
}: CreateConnectionFormProps) => {
  const { data: session }: any = useSession();
  const { register, handleSubmit, control, watch, reset } = useForm({
    defaultValues: {
      name: '',
      sources: { label: '', id: '' },
      destinations: { label: '', id: '' },
      destinationSchema: '',
    },
  });
  const [sources, setSources] = useState<Array<string>>([]);
  const [sourceStreams, setSourceStreams] = useState<Array<string>>([]);

  const { data: sourcesData } = useSWR(`${backendUrl}/api/airbyte/sources`);

  const watchSourceSelection = watch('sources');

  const globalContext = useContext(GlobalContext);

  // when the source list changes
  useEffect(() => {
    if (sourcesData && sourcesData.length > 0) {
      const rows = sourcesData.map((element: any) => ({
        label: element.name,
        id: element.sourceId,
      }));
      setSources(rows);
    }
  }, [sourcesData]);

  // source selection changes
  useEffect(() => {
    if (watchSourceSelection?.id) {
      // console.log(watchSourceSelection);

      (async () => {
        try {
          const message = await httpGet(
            session,
            `airbyte/sources/${watchSourceSelection.id}/schema_catalog`
          );
          const streamNames: any[] = [];
          message['catalog']['streams'].forEach((el: any) => {
            streamNames.push(el.stream.name);
          });
          setSourceStreams(streamNames);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        // message looks like {
        //     "catalog": {
        //         "streams": [
        //             {
        //                 "stream": {
        //                     "name": "ngo1_visits_per_day",
        //                     "jsonSchema": {
        //                         "type": "object",
        //                         "properties": {
        //                             "date": { "format": "date", "type": "string"},
        //                             "gender": { "type": "string"},
        //                             "count": {"airbyte_type": "integer","type": "number"}
        //                         }
        //                     },
        //                     "supportedSyncModes": ["full_refresh","incremental"],
        //                     "defaultCursorField": [],
        //                     "sourceDefinedPrimaryKey": [],
        //                     "namespace": "public"
        //                 },
        //                 "config": {
        //                     "syncMode": "full_refresh",
        //                     "cursorField": [],
        //                     "destinationSyncMode": "append",
        //                     "primaryKey": [],
        //                     "aliasName": "ngo1_visits_per_day",
        //                     "selected": true,
        //                     "suggested": true
        //                 }
        //             }
        //         ]
        //     },
        //     "jobInfo": {
        //         "id": "8004c637-eb94-4d9b-a12a-aa4ca3493534",
        //         "configType": "discover_schema",
        //         "configId": "NoConfiguration",
        //         "createdAt": 0,
        //         "endedAt": 0,
        //         "succeeded": true,
        //         "connectorConfigurationUpdated": false,
        //         "logs": {
        //             "logLines": []
        //         }
        //     },
        //     "catalogId": "f1b42ce1-dc1f-4633-963c-dd28aff0aef9"
        // }
      })();
    }
  }, [watchSourceSelection]);

  const handleClose = () => {
    reset();
    setSourceStreams([]);
    setShowForm(false);
  };

  // create a new connection
  const onSubmit = async (data: any) => {
    const payload: any = {
      name: data.name,
      sourceId: data.sources.id,
      streamNames: sourceStreams,
    };
    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }
    try {
      await httpPost(session, 'airbyte/connections/', payload);
      mutate();
      handleClose();
      successToast('created connection', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <TextField
            sx={{ width: '100%' }}
            label="Name"
            variant="outlined"
            {...register('name', { required: true })}
          ></TextField>

          <Box sx={{ m: 2 }} />

          <TextField
            sx={{ width: '100%' }}
            label="Destination Schema"
            variant="outlined"
            {...register('destinationSchema')}
          ></TextField>

          <Box sx={{ m: 2 }} />

          <Controller
            name="sources"
            control={control}
            rules={{ required: true }}
            render={({ field }: any) => (
              <Autocomplete
                options={sources}
                value={field.value}
                onChange={(e, data) => field.onChange(data)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select source"
                    variant="outlined"
                  />
                )}
              />
            )}
          />

          <Box sx={{ m: 2 }} />

          {sourceStreams.length > 0 && (
            <>
              <div>Available Tables / Views</div>
              <ul>
                {sourceStreams.map((stream) => (
                  <li key={stream}>{stream}</li>
                ))}
              </ul>
              <div>For now we will sync all, selection coming soon</div>
            </>
          )}
        </Box>
      </>
    );
  };
  return (
    <>
      <CustomDialog
        title={'Add a new connection'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<FormContent />}
        formActions={
          <>
            <Button variant="contained" type="submit">
              Connect
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </>
        }
      ></CustomDialog>
    </>
  );
};

export default CreateConnectionForm;
