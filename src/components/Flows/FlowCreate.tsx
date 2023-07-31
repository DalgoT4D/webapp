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
import { httpGet, httpPost, httpPut } from '@/helpers/http';
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
  cronDaysOfWeek: Array<AutoCompleteOption>;
};

type AutoCompleteOption = {
  id: string;
  label: string;
};

const WEEKDAYS: any = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
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
  const [daysOfWeek, setDaysOfWeek] = useState<any>([]);
  const {
    register,
    handleSubmit,
    control,
    formState: { dirtyFields, errors },
    reset,
    watch,
    getValues,
  } = useForm<DeploymentDef>({
    defaultValues: {
      active: true,
      name: '',
      dbtTransform: 'no',
      connectionBlocks: [],
      cron: '',
      cronDaysOfWeek: [],
    },
  });

  const scheduleSelected: any = watch('cron');

  const handleClickCancel = () => {
    setSelectedFlow('');
    updateCrudVal('index');
  };

  const convertToCronExpression = (
    schedule: string,
    daysOfWeek: Array<string> = ['1']
  ) => {
    const cronMappings: any = {
      daily: '0 1 * * *',
      weekly: `0 1 * * ${daysOfWeek.join(',')}`,
    };

    if (schedule in cronMappings) {
      return cronMappings[schedule];
    }

    // default return daily
    return cronMappings.daily;
  };

  const convertCronToString = (cronExp: string) => {
    /* 
    Figure out from the cron expression whether the flow is running daily or weekly
    If day of the week is set that means its weekly or else its daily 
    Returns {'daily/weekly', [<days-of-week-if-weekly-selected>]}
    */
    const vals = cronExp.split(' ');
    const daysOfWeek = vals[vals.length - 1];
    if (daysOfWeek != '*')
      return { schedule: 'weekly', daysOfWeek: daysOfWeek.split(',') };
    return { schedule: 'daily', daysOfWeek: [] };
  };

  useEffect(() => {
    if (flowId) {
      (async () => {
        try {
          const data: any = await httpGet(session, `prefect/flows/${flowId}`);
          reset({
            cron: {
              id: convertCronToString(data.cron).schedule,
              label: convertCronToString(data.cron).schedule,
            },
            dbtTransform: data.parameters.dbt_blocks.length > 0 ? 'yes' : 'no',
            connectionBlocks: data.parameters.airbyte_blocks.map(
              (data: any) => data.name
            ),
            active: data.isScheduleActive,
            name: data.name,
            cronDaysOfWeek: convertCronToString(data.cron).daysOfWeek.map(
              (day: string) => ({
                id: day,
                label: WEEKDAYS[day],
              })
            ),
          });
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
      })();
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
      const cronExpression = convertToCronExpression(
        data.cron.id,
        data.cronDaysOfWeek.map((option: AutoCompleteOption) => option.id)
      );
      if (isEditPage) {
        // hit the set schedule api if the value is updated
        if (dirtyFields?.active) {
          await httpPost(
            session,
            `prefect/flows/${flowId}/set_schedule/${
              data.active ? 'active' : 'inactive'
            }`,
            {}
          );
        }

        // hit the update deplyment api if the cron is updated
        if (dirtyFields?.cron || dirtyFields?.cronDaysOfWeek) {
          await httpPut(session, `prefect/flows/${flowId}`, {
            cron: cronExpression,
          });
        }
        successToast(
          `Flow ${data.name} updated successfully`,
          [],
          toastContext
        );
        setSelectedFlow('');
        mutate();
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
          cron: cronExpression,
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
                  error={!!errors.name}
                  helperText={errors.name?.message}
                ></Input>
              </Box>
              <Box>
                <Controller
                  name="connectionBlocks"
                  control={control}
                  rules={{ required: 'Atleast one connection is required' }}
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
                          error={!!errors.connectionBlocks}
                          helperText={errors.connectionBlocks?.message}
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
            <Box sx={{ marginBottom: '30px' }}>
              <Controller
                name="cron"
                control={control}
                rules={{ required: 'Schedule is required' }}
                render={({ field }) => (
                  <Autocomplete
                    id="cron"
                    value={field.value}
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
                        label="Daily/Weekly"
                        variant="outlined"
                        error={!!errors.cron}
                        helperText={errors.cron?.message}
                      />
                    )}
                  />
                )}
              />
            </Box>
            {scheduleSelected?.id === 'weekly' ? (
              <Box>
                <Controller
                  name="cronDaysOfWeek"
                  control={control}
                  rules={{ required: 'Day(s) of week is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      id="cronDaysOfWeek"
                      multiple
                      data-testid="cronDaysOfWeek"
                      value={field.value}
                      options={Object.keys(WEEKDAYS).map((key) => ({
                        id: String(key),
                        label: WEEKDAYS[key],
                      }))}
                      isOptionEqualToValue={(option: any, val: any) =>
                        val && option?.id === val?.id
                      }
                      onChange={(e, data: Array<AutoCompleteOption>) =>
                        field.onChange(data)
                      }
                      renderInput={(params) => (
                        <Input
                          name="cronDaysOfWeek"
                          {...params}
                          placeholder="Select day"
                          label="Day of the week"
                          variant="outlined"
                          error={!!errors.cronDaysOfWeek}
                          helperText={errors.cronDaysOfWeek?.message}
                        />
                      )}
                    />
                  )}
                />
              </Box>
            ) : (
              ''
            )}
          </Box>
        </Box>
      </form>
    </>
  );
};

export default FlowCreate;
