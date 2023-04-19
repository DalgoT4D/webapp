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

function createData(name: string, sourceDest: string, lastSync: string) {
  return [name, sourceDest, lastSync];
}

const fakeRows: Array<Array<string>> = [
  createData('Connection 1', 'SWS -> PED', '28th March 2020'),
];

const headers = ['Connection details', 'Source → Destination', 'Last sync'];

export const Connections = () => {
  const { data: session }: any = useSession();
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      name: '',
      sources: { label: '', id: '' },
      destinations: { label: '', id: '' },
    },
  });

  const [showDialog, setShowDialog] = useState(false);
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const [sources, setSources] = useState<Array<string>>([]);
  const [destinations, setDestinations] = useState<Array<string>>([]);
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/connections`
  );

  const { data: sourcesData } = useSWR(`${backendUrl}/api/airbyte/sources`);
  const { data: destinationData } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
        element.lastSync,
      ]);
      setRows(rows);
    } else {
      setRows(fakeRows);
    }
  }, [data]);
  useEffect(() => {
    if (sourcesData && sourcesData.length > 0) {
      const rows = sourcesData.map((element: any) => ({
        label: element.name,
        id: element.sourceId,
      }));
      console.log(rows);
      setSources(rows);
    }
  }, [sourcesData]);

  useEffect(() => {
    if (destinationData && destinationData.length > 0) {
      const rows = destinationData.map((element: any) => ({
        label: element.name,
        id: element.destinationId,
      }));
      setDestinations(rows);
    }
  }, [destinationData]);

  if (isLoading) {
    return <CircularProgress />;
  }

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  const onSubmit = async (data: any) => {
    await fetch(`${backendUrl}/api/airbyte/connections/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        name: data.name,
        sourceId: data.sources.id,
        destinationId: data.destinations.id,
        streamNames: ['some_random_stream_name'],
      }),
    }).then(() => {
      handleClose();
    });
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
              <Controller
                name="destinations"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    options={destinations}
                    onChange={(e, data) => field.onChange(data)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select destination"
                        variant="outlined"
                      />
                    )}
                  />
                )}
              />
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
    </>
  );
};
