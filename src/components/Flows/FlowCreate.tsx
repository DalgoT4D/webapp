import { GlobalContext } from '@/contexts/ContextProvider';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  InputLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';
import Input from '../UI/Input/Input';

interface FlowCreateInterface {
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
}

type ApiResponseConnection = {
  blockName: string;
  name: string;
};
// DispConnection is for the AutoComplete list: {id, label}
type DispConnection = {
  id: string;
  label: string;
};

type DeploymentDef = {
  name: string;
  dbtTransform: string;
  connectionBlocks: Array<any>;
  cron: string;
};

const FlowCreate = ({ updateCrudVal, mutate }: FlowCreateInterface) => {
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  const [connections, setConnections] = useState<DispConnection[]>([]);
  const { register, handleSubmit, control } = useForm<DeploymentDef>({
    defaultValues: {
      name: '',
      dbtTransform: 'no',
      connectionBlocks: [],
      cron: '',
    },
  });

  const handleClickCancel = () => {
    updateCrudVal('index');
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
      try {
        const data = await httpGet(session, 'airbyte/connections');
        const tempConns: Array<DispConnection> = data.map(
          (conn: ApiResponseConnection) => {
            return {
              id: conn.blockName,
              label: conn.name,
              name: conn.name,
              blockName: conn.blockName,
            };
          }
        );
        setConnections(tempConns);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  }, []);

  const onSubmit = async (data: any) => {
    console.log(data);
    try {
      const blocks = data.connectionBlocks.map((block: any, index: number) => ({
        ...block,
        seq: index + 1,
      }));
      const response = await httpPost(session, 'prefect/flows/', {
        name: data.name,
        connectionBlocks: blocks,
        dbtTransform: data.dbtTransform,
        cron: processCronExpression(data.cron.id),
      });
      mutate();
      updateCrudVal('index');
      successToast(
        `Flow ${response.name} created successfully`,
        [],
        toastContext
      );
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} data-testid="form">
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
            Create a new Flow
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography
              data-testid="cancellink"
              onClick={handleClickCancel}
              fontWeight={600}
              sx={{ m: 1, ':hover': { cursor: 'pointer' } }}
            >
              Cancel
            </Typography>
            <Button
              variant="contained"
              sx={{ m: 1 }}
              type="submit"
              data-testid="savebutton"
            >
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
            <Typography
              variant="h5"
              sx={{ marginBottom: '30px' }}
              fontWeight={600}
            >
              Flow details
            </Typography>
            <Stack gap="12px">
              <Box>
                <Input
                  sx={{ width: '90%' }}
                  variant="outlined"
                  register={register}
                  name="name"
                  label="Flow name"
                  placeholder="Enter the flow name"
                  required
                ></Input>
              </Box>
              <Box>
                <Controller
                  name="connectionBlocks"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }: any) => (
                    <Autocomplete
                      id="connectionBlocks"
                      multiple
                      data-testid="connectionautocomplete"
                      value={field.value}
                      sx={{ marginBottom: '10px', width: '90%' }}
                      options={connections}
                      isOptionEqualToValue={(option: any, val: any) =>
                        val && option?.id === val?.id
                      }
                      onChange={(e, data) => field.onChange(data)}
                      renderInput={(params) => (
                        <Input
                          {...params}
                          placeholder="Select your connection"
                          name="connectionBlocks"
                          variant="outlined"
                          label="Connections"
                          required
                        />
                      )}
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
                    id="cron"
                    data-testid="cronautocomplete"
                    options={[
                      { id: 'daily', label: 'daily' },
                      { id: 'weekly', label: 'weekly' },
                    ]}
                    onChange={(e, data) => field.onChange(data)}
                    isOptionEqualToValue={(option: any, val: any) =>
                      val && option?.id === val?.id
                    }
                    renderInput={(params) => (
                      <Input
                        name="cron"
                        {...params}
                        placeholder="Select schedule"
                        label="Schedule"
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
