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
  flowId?: string;
  setSelectedFlow?: (args: string) => any;
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
  active: boolean;
  name: string;
  dbtTransform: string;
  connectionBlocks: Array<any>;
  cron: string | object;
};

const FlowCreate = ({
  flowId,
  updateCrudVal,
  mutate,
  setSelectedFlow = () => {},
}: FlowCreateInterface) => {
  const isEditPage = flowId !== '' && flowId !== undefined;
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  const [connections, setConnections] = useState<DispConnection[]>([]);
  const { register, handleSubmit, control, setValue } = useForm<DeploymentDef>({
    defaultValues: {
      active: true,
      name: '',
      dbtTransform: 'no',
      connectionBlocks: [],
      cron: '',
    },
  });

  const handleClickCancel = () => {
    setSelectedFlow('');
    updateCrudVal('index');
  };

  const convertCronExpression = (input: string) => {
    const cronMappings: any = {
      daily: '0 1 * * *',
      weekly: '0 1 * * 1',
    };

    if (input in cronMappings) {
      return cronMappings[input];
    }

    const reverseCronMappings = Object.fromEntries(
      Object.entries(cronMappings).map(([key, value]) => [value, key])
    );

    return reverseCronMappings[input] || '0 1 * * *';
  };

  useEffect(() => {
    if (flowId) {
      (async () => {
        try {
          const data: any = await httpGet(session, `prefect/flows/${flowId}`);
          setValue('name', data.name);
          setValue('active', data.isScheduleActive);
          setValue(
            'connectionBlocks',
            data.parameters.airbyte_blocks.map((data: any) => data.name)
          );
          setValue(
            'dbtTransform',
            data.parameters.dbt_blocks.length > 0 ? 'yes' : 'no'
          );
          setValue('cron', {
            id: convertCronExpression(data.cron),
            label: convertCronExpression(data.cron),
          });
        } catch (err: any) {
          console.error(err);
          // errorToast(err.message, [], globalContext);
        }
      })();
      // setLoading(false);
    }
  }, [flowId]);

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
    try {
      if (isEditPage) {
        await httpPost(
          session,
          `prefect/flows/${flowId}/set_schedule/${
            data.active ? 'active' : 'inactive'
          }`,
          {}
        );
        successToast(
          `Flow ${data.name} updated successfully`,
          [],
          toastContext
        );
        setSelectedFlow('');
        updateCrudVal('index');
      } else {
        const blocks = data.connectionBlocks.map(
          (block: any, index: number) => ({
            ...block,
            seq: index + 1,
          })
        );
        const response = await httpPost(session, 'prefect/flows/', {
          name: data.name,
          connectionBlocks: blocks,
          dbtTransform: data.dbtTransform,
          cron: convertCronExpression(data.cron.id),
        });
        mutate();
        updateCrudVal('index');
        successToast(
          `Flow ${response.name} created successfully`,
          [],
          toastContext
        );
      }
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
            {flowId ? 'Update flow' : 'Create a new Flow'}
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
              {isEditPage && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Controller
                    name="active"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Stack direction={'row'} alignItems="center" gap={'10%'}>
                        <Switch
                          checked={value}
                          value={value}
                          onChange={(event, value) => {
                            onChange(value);
                          }}
                        />
                      </Stack>
                    )}
                  />
                  <InputLabel sx={{ marginBottom: '5px' }}>
                    Is Active ?
                  </InputLabel>
                </Box>
              )}
              <Box>
                <Input
                  sx={{ width: '90%' }}
                  variant="outlined"
                  register={register}
                  disabled={isEditPage}
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
                      disabled={isEditPage}
                      multiple
                      ChipProps={{
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        'data-testid': 'connectionchip',
                      }}
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
                        checked={value === 'yes'}
                        disabled={isEditPage}
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
                    value={field.value}
                    disabled={isEditPage}
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
