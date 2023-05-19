import { backendUrl } from '@/config/constant';
import { GlobalContext } from '@/contexts/ContextProvider';
import { Delete } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  InputLabel,
  Link,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';

interface FlowCreateInterface {
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
}

const FlowCreate = ({ updateCrudVal, mutate }: FlowCreateInterface) => {
  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);
  const [currentSelectedConn, setCurrentSelectedConn] = useState<any>(null);
  const [connections, setConnections] = useState<any>([
    { id: 'block1', label: 'block1' },
    { id: 'block2', label: 'block2' },
  ]);
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      name: '',
      dbtTransform: 'no',
      connectionBlocks: [],
      cron: '',
    },
  });

  const { append, remove, fields }: any = useFieldArray<any>({
    control,
    name: 'connectionBlocks',
  });

  const handleClickCancel = () => {
    updateCrudVal('index');
  };

  const handleAddConnectionSelectChange = (e: any, data: any) => {
    setCurrentSelectedConn(null);
    if (data?.id) {
      append({ seq: fields.length + 1, blockName: data.id });
      // remove from the select dropdown to add new connection
      const tempConns = connections?.filter((conn: any) => conn?.id != data.id);
      setConnections(tempConns);
    }
  };

  const handleDeleteConnection = (idx: number) => {
    remove(idx);
    const tempConns: Array<any> = connections ? connections : [];
    tempConns.push({
      id: fields[idx]?.blockName,
      label: fields[idx]?.blockName,
    });
    setConnections(tempConns);
  };

  const processCronExpression = (cron: string) => {
    switch (cron) {
      case 'daily':
        return '0 1 * * *';
      case 'weekly':
        return '0 1 * * 1';
      default: // daily is the default
        return '0 1 * * *';
    }
  };

  useEffect(() => {
    (async () => {
      await fetch(`${backendUrl}/api/airbyte/connections`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          // Prepare the specs config before setting it
          const tempConns: Array<any> = [];
          data.forEach((conn: any) => {
            tempConns.push({ id: conn?.blockName, label: conn?.name });
          });
          setConnections(tempConns);
        })
        .catch((err) => {
          console.log('something went wrong', err);
        });
    })();
  }, []);

  const onSubmit = async (data: any) => {
    await fetch(`${backendUrl}/api/prefect/flows/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        name: data.name,
        connectionBlocks: data.connectionBlocks,
        dbtTransform: data.dbtTransform,
        cron: processCronExpression(data.cron),
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        mutate();
        updateCrudVal('index');
        successToast(`Flow ${data?.name} created successfully`, [], context);
      })
      .catch((err) => {
        errorToast(String(err), [], context);
      });
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
            Create a new Flow
          </Typography>
          <Box>
            <Link
              onClick={handleClickCancel}
              sx={{ m: 1, ':hover': { cursor: 'pointer' } }}
            >
              Cancel
            </Link>
            <Button variant="contained" sx={{ m: 1 }} type="submit">
              Save changes
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            marginTop: '50px',
            backgroundColor: 'white',
            padding: '33px 50px 33px 50px',
            display: 'flex',
            height: '500px',
            gap: '50px',
          }}
        >
          <Box sx={{ width: '60%' }}>
            <Typography variant="h5" sx={{ marginBottom: '30px' }}>
              Flow details
            </Typography>
            <Stack gap="12px">
              <Box>
                <InputLabel sx={{ marginBottom: '5px' }} required={true}>
                  Flow Name
                </InputLabel>
                <TextField
                  sx={{ width: '100%' }}
                  variant="outlined"
                  {...register('name', { required: true })}
                ></TextField>
              </Box>
              <Box>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Connections
                </InputLabel>
                {fields.map((conn: any, idx: number) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <TextField
                      sx={{ marginBottom: '10px', width: '90%' }}
                      value={conn.blockName}
                      aria-readonly
                    />

                    <IconButton onClick={() => handleDeleteConnection(idx)}>
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Autocomplete
                  value={currentSelectedConn}
                  sx={{ marginBottom: '10px', width: '90%' }}
                  options={connections}
                  isOptionEqualToValue={(option: any, val: any) =>
                    val && option?.id === val?.id
                  }
                  onChange={handleAddConnectionSelectChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      label="add connection"
                    />
                  )}
                />
              </Box>
              <Box>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Transform data ?
                </InputLabel>
                <Controller
                  name="dbtTransform"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Stack direction={'row'} alignItems="center" gap={'10%'}>
                      <Switch
                        value={value}
                        onChange={(event, value) => {
                          onChange(value ? 'yes' : 'no');
                        }}
                      />
                    </Stack>
                  )}
                />
              </Box>
            </Stack>
          </Box>
          <Divider orientation="vertical" />
          <Box sx={{ width: '40%' }}>
            <Typography variant="h5" sx={{ marginBottom: '30px' }}>
              Schedule
            </Typography>
            <Box>
              <Controller
                name="cron"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Autocomplete
                    options={[
                      { id: 'daily', label: 'daily' },
                      { id: 'weekly', label: 'weekly' },
                    ]}
                    onChange={(e, data) => field.onChange(data)}
                    isOptionEqualToValue={(option: any, val: any) =>
                      val && option?.id === val?.id
                    }
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
          </Box>
        </Box>
      </form>
    </>
  );
};

export default FlowCreate;
