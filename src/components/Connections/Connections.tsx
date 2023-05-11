import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { List } from '../List/List';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { backendUrl } from '@/config/constant';
import { Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSession } from 'next-auth/react';

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();
  const { register, handleSubmit, control, watch, reset } = useForm({
    defaultValues: {
      name: '',
      sources: { label: '', id: '' },
      destinations: { label: '', id: '' },
      destinationSchema: '',
    },
  });

  const watchSourceSelection = watch('sources');

  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState<Array<Array<string>>>([]);

  const [connections, setConnections] = useState<object[]>([]);
  const [sources, setSources] = useState<Array<string>>([]);
  const [sourceStreams, setSourceStreams] = useState<Array<string>>([]);

  const { data, isLoading, mutate } = useSWR(`${backendUrl}/api/airbyte/connections`);
  const { data: sourcesData } = useSWR(`${backendUrl}/api/airbyte/sources`);

  // when the connection list changes
  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
        element.lastSync,
      ]);
      setRows(rows);
    }
  }, [data]);

  // when the connection list changes
  useEffect(() => {
    if (data && data.length > 0) {
      setConnections(data);
    }
  }, [data]);

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
      console.log(watchSourceSelection);
      (async () => {
        await fetch(`${backendUrl}/api/airbyte/sources/${watchSourceSelection.id}/schema_catalog`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
          },
        }).then((response) => {

          if (response.ok) {
            response.json().then((message) => {
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
              const streamNames: any[] = [];
              message['catalog']['streams'].forEach((el: any) => {
                streamNames.push(el.stream.name);
              })
              setSourceStreams(streamNames);
            });
          }

        });
      })();
    }
  }, [watchSourceSelection]);

  // show load progress indicator
  if (isLoading) {
    return <CircularProgress />;
  }

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleClose = () => {
    reset();
    setSourceStreams([]);
    setShowDialog(false);
  };

  // create a new connection
  const onSubmit = async (data: any) => {
    const payload: any = {
      name: data.name,
      sourceId: data.sources.id,
      streamNames: sourceStreams,
    }
    if (data.destinationSchema) {
      payload.destinationSchema = data.destinationSchema;
    }
    await fetch(`${backendUrl}/api/airbyte/connections/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify(payload),
    }).then(() => {
      mutate();
      reset();
      handleClose();
    });
  };

  const syncConnection = (connection: any) => {
    console.log(connection);
    (async () => {
      await fetch(`${backendUrl}/api/airbyte/connections/${connection.blockId}/sync/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
        },
      }).then((response) => {
        if (response.ok) {
          response.json().then((message) => {
            console.log(message);
          })
        }
      });
    })();
  };

  return (
    <>
      <Dialog open={showDialog} onClose={handleClose}>

        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}> Add a new connection</Box>
            <Box>
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ minWidth: '400px' }}>
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
                render={({ field }) => (
                  <Autocomplete
                    options={sources}
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

              {sourceStreams.length > 0 &&
                <>
                  <div>Available Tables / Views</div>
                  <ul>
                    {sourceStreams.map((stream) =>
                      <li key={stream}>{stream}</li>
                    )}
                  </ul>
                  <div>For now we will sync all, selection coming soon</div>
                </>
              }


            </Box>
          </DialogContent>
          <DialogActions
            sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}
          >
            <Button variant="contained" type="submit">
              Connect
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <List
        openDialog={handleClickOpen}
        title="Connection"
        headers={headers}
        rows={rows}
      />

      {connections && connections.length > 0 &&
        <>
          <div>(/for demo/)</div>
          {connections.map((connection: any) =>
            <button key={connection.blockId} onClick={() => syncConnection(connection)}>SYNC &quot{connection.name}&quot</button>
          )}
        </>
      }


    </>
  );
};
