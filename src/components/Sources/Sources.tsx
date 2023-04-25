import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import { List } from '../List/List';
import { backendUrl } from '@/config/constant';
import { Close } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';

function createData(details: string, type: string) {
  return [details, type];
}

const fakeRows: Array<Array<string>> = [
  createData('Stir-SurveyCTO - 1', 'SurveyCTO'),
  createData('Stir-SurveyCTO - 2', 'SurveyCTO'),
];

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, error } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [sourceDefs, setSourceDefs] = useState([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState(null);

  const { register, handleSubmit, control, watch } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' },
      config: {},
    },
  });

  const watchSelectedSourceDef = watch('sourceDef');

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.sourceDest,
      ]);
      setRows(rows);
    } else {
      setRows(fakeRows);
    }
  }, [data]);

  useEffect(() => {
    if (showDialog && sourceDefs.length === 0) {
      (async () => {
        await fetch(`${backendUrl}/api/airbyte/source_definitions`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
          },
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            const sourceDefRows = data.map((element: any) => ({
              label: element.name,
              id: element.sourceDefinitionId,
            }));
            setSourceDefs(sourceDefRows);
          })
          .catch((err) => {
            console.log('something went wrong', err);
          });
      })();
    }
  }, [showDialog]);

  useEffect(() => {
    if (watchSelectedSourceDef.id) {
      (async () => {
        await fetch(
          `${backendUrl}/api/airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session?.user.token}`,
            },
          }
        )
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            setSourceDefSpecs(data);
            console.log('setting source def specs', data);
          })
          .catch((err) => {
            console.log('something went wrong', err);
          });
      })();
    }
  }, [watchSelectedSourceDef]);

  if (isLoading) {
    return <CircularProgress />;
  }

  const handleClose = () => {
    setShowDialog(false);
  };

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    console.log('submitting form');
    // await fetch(`${backendUrl}/api/airbyte/connections/`, {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${session?.user.token}`,
    //   },
    //   body: JSON.stringify({
    //     name: data.name,
    //     sourceId: data.sources.id,
    //     destinationId: data.destinations.id,
    //     streamNames: ['some_random_stream_name'],
    //   }),
    // }).then(() => {
    //   handleClose();
    // });
  };

  return (
    <>
      <Dialog open={showDialog} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}> Add a new source</Box>
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
                name="sourceDef"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    options={sourceDefs}
                    onChange={(e, data) => field.onChange(data)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select source type"
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
              Save changes and test
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleClose}>
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <List
        openDialog={handleClickOpen}
        title="Source"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
