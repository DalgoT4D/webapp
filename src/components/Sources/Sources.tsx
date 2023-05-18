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
import { SourceConfigInput } from './SourceConfigInput';
import { httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';

const headers = ['Source details', 'Type'];

export const Sources = () => {
  const { data: session }: any = useSession();
  const [rows, setRows] = useState<Array<Array<string>>>([]);
  const { data, isLoading, mutate } = useSWR(
    `${backendUrl}/api/airbyte/sources`
  );
  const [showDialog, setShowDialog] = useState(false);
  const [sourceDefs, setSourceDefs] = useState([]);
  const [sourceDefSpecs, setSourceDefSpecs] = useState<Array<any>>([]);
  const toastContext = useContext(GlobalContext);

  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
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
    }
  }, [data]);

  useEffect(() => {
    if (showDialog && sourceDefs.length === 0) {

      (async () => {
        try {
          const data = await httpGet(session, 'airbyte/source_definitions');
          const sourceDefRows = data?.map((element: any) => ({
            label: element.name,
            id: element.sourceDefinitionId,
          }));
          setSourceDefs(sourceDefRows);
        }
        catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        };
      })();
    }
  }, [showDialog]);

  useEffect(() => {
    if (watchSelectedSourceDef?.id) {
      (async () => {
        try {
          const data = await httpGet(session, `airbyte/source_definitions/${watchSelectedSourceDef.id}/specifications`);
          // Prepare the specs config before setting it
          const specsConfigFields: Array<any> = [];
          for (const [key, value] of Object.entries(data?.properties || {})) {
            specsConfigFields.push({
              airbyte_secret: false,
              ...(value as object),
              field: key,
              required: data?.required.includes(key),
            });
          }
          setSourceDefSpecs(specsConfigFields);
        }
        catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
    }
  }, [watchSelectedSourceDef]);

  const handleClose = () => {
    reset();
    setSourceDefSpecs([]);
    setShowDialog(false);
  };

  const handleClickOpen = () => {
    setShowDialog(true);
  };

  const onSubmit = async (data: any) => {
    try {
      await httpPost(session, 'airbyte/sources/', {
        name: data.name,
        sourceDefId: data.sourceDef.id,
        config: data.config,
      });
      mutate();
      handleClose();
      successToast("Source added", [], toastContext);
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

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
              <Box sx={{ m: 2 }} />
              <SourceConfigInput
                specs={sourceDefSpecs}
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
        title="Source"
        headers={headers}
        rows={rows}
      />
    </>
  );
};
