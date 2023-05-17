import { Delete, Add } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  IconButton,
  InputLabel,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

interface FlowCreateInterface {
  updateCrudVal: (...args: any) => any;
}

const FlowCreate = ({ updateCrudVal }: FlowCreateInterface) => {
  const [currentSelectedConn, setCurrentSelectedConn] = useState<any>(null);
  const [connections, setConnections] = useState<any>([
    { id: 'block1', label: 'block1' },
    { id: 'block2', label: 'block2' },
  ]);
  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
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

  const onSubmit = async (data: any) => {
    console.log(data);
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
                      label="select connection"
                    />
                  )}
                />
                <IconButton
                  onClick={() =>
                    append({ seq: 0, blockName: 'stir-surveycto-postgres' })
                  }
                >
                  <Add />
                </IconButton>
              </Box>
              <Box>
                <InputLabel sx={{ marginBottom: '5px' }}>
                  Transformation
                </InputLabel>
                <TextField
                  sx={{ width: '100%' }}
                  variant="outlined"
                  {...register('dbtTransform', { required: true })}
                ></TextField>
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
                      { id: 'monthly', label: 'monthly' },
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
