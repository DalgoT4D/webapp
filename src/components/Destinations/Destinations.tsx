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
import { DestinationConfigInput } from './DestinationConfigInput';

const headers = ['Destination details', 'Type'];

export const Destinations = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, error, mutate } = useSWR(
    `${backendUrl}/api/airbyte/destinations`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [destinationDefs, setDestinationDefs] = useState([]);
  const [destinationDefSpecs, setDestinationDefSpecs] = useState<Array<any>>([]);

  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      destinationDef: { id: '', label: '' },
      config: {},
    },
  });

  const watchSelectedDestinationDef = watch('destinationDef');

  useEffect(() => {
    if (data && data.length > 0) {
      const rows = data.map((element: any) => [
        element.name,
        element.destinationDest,
      ]);
      setRows(rows);
    }
  }, [data]);

  useEffect(() => {
    if (showDialog && destinationDefs.length === 0) {
      (async () => {
        await fetch(`${backendUrl}/api/airbyte/destination_definitions`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session?.user.token}`,
          },
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            const destinationDefRows = data?.map((element: any) => ({
              label: element.name,
              id: element.destinationDefinitionId,
            }));
            setDestinationDefs(destinationDefRows);
          })
          .catch((err) => {
            console.log('something went wrong', err);
          });
      })();
    }
  }, [showDialog]);

  useEffect(() => {
    if (watchSelectedDestinationDef?.id) {
      (async () => {
        await fetch(
          `${backendUrl}/api/airbyte/destination_definitions/${watchSelectedDestinationDef.id}/specifications`,
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
            // Prepare the specs config before setting it
            const specsConfigFields: Array<any> = [];
            for (const [key, value] of Object.entries(data?.properties || {})) {
              specsConfigFields.push({
                ...(value as object),
                field: key,
                required: data?.required.includes(key),
              });
            }
            setDestinationDefSpecs(specsConfigFields);
          })
          .catch((err) => {
            console.log('something went wrong', err);
          });
      })();
    }
  }, [watchSelectedDestinationDef]);

  const handleClose = () => {
    reset();
    setDestinationDefSpecs([]);
    setShowDialog(false);
  };

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    await fetch(`${backendUrl}/api/airbyte/destinations/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        name: data.name,
        destinationDefId: data.destinationDef.id,
        config: data.config,
      }),
    })
      .then(() => {
        mutate();
        handleClose();
      })
      .catch((err) => {
        console.log('something went wrong', err);
      });
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <>
      <Dialog open={showDialog} onClose={handleClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Box flexGrow={1}> Add a new destination</Box>
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
                name="destinationDef"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    options={destinationDefs}
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
              />
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}
          >
            <Button variant="contained" type="submit">
              Save changes and test
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancel"
            >
              Cancel
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <List
        openDialog={handleClickOpen}
        title="Destination"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
