import { GlobalContext } from '@/contexts/ContextProvider';
import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  InputLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpGet, httpPost, httpPut } from '@/helpers/http';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import Input from '../UI/Input/Input';
import moment, { Moment } from 'moment';
import { Connection } from '@/components/Connections/Connections';
import { TransformTask } from '../DBT/DBTTarget';
import { TaskSequence } from './TaskSequence';
import { localTimezone } from '@/utils/common';

interface FlowCreateInterface {
  updateCrudVal: (...args: any) => any;
  mutate: (...args: any) => any;
  flowId?: string;
  setSelectedFlowId?: (args: string) => any;
  tasks: Array<TransformTask>;
}

// DispConnection is for the AutoComplete list: {id, label}
type DispConnection = {
  id: string;
  label: string;
};

type DeploymentDef = {
  active: boolean;
  name: string;
  tasks: Array<TransformTask>;
  connections: Array<any>;
  cron: string | object | null;
  cronDaysOfWeek: Array<AutoCompleteOption>;
  cronTimeOfDay: string;
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

export const ValidateDefaultTasksToApplyInPipeline = (task: TransformTask) =>
  task.generated_by === 'system' && task.pipeline_default;

const FlowCreate = ({
  flowId,
  updateCrudVal,
  mutate,
  setSelectedFlowId = () => {},
  tasks,
}: FlowCreateInterface) => {
  const isEditPage = flowId !== '' && flowId !== undefined;
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);

  const [connectionOptions, setConnectionOptions] = useState<DispConnection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { dirtyFields, errors },
    reset,
    watch,
    setValue,
  } = useForm<DeploymentDef>({
    defaultValues: {
      active: true,
      name: '',
      connections: [],
      cron: null,
      tasks: [],
      cronDaysOfWeek: [],
      cronTimeOfDay: '',
    },
  });

  const [alignment, setAlignment] = useState('simple');
  const handleChange = (event: React.MouseEvent<HTMLElement>, newAlignment: string) => {
    if (newAlignment === 'simple') {
      setValue('tasks', []);
    }
    setAlignment(newAlignment);
  };

  const scheduleSelected: any = watch('cron');

  const handleClickCancel = () => {
    setSelectedFlowId('');
    updateCrudVal('index');
  };

  const convertToCronExpression = (
    schedule: string,
    daysOfWeek: Array<string> = ['1'],
    timeOfDay = '1 0' // will always be in UTC & 24 hour format, default 1:00AM = '1 0'
  ) => {
    const [utcHours, utcMinutes] = timeOfDay.split(' ');
    const cronMappings: any = {
      manual: '',
      daily: `${utcMinutes} ${utcHours} * * *`,
      weekly: `${utcMinutes} ${utcHours} * * ${daysOfWeek.join(',')}`,
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
    if (!cronExp)
      return {
        schedule: 'manual',
        daysOfWeek: [],
        timeOfDay: '',
      };
    const vals = cronExp.split(' ');
    const daysOfWeek = vals[vals.length - 1].replace(/\*/g, '');
    const [utcHours, utcMinutes] = vals.splice(0, 2);
    return {
      schedule: daysOfWeek != '' ? 'weekly' : 'daily',
      daysOfWeek: daysOfWeek != '' ? daysOfWeek.split(',') : [],
      timeOfDay: `${utcMinutes} ${utcHours}`,
    };
  };

  useEffect(() => {
    if (flowId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(session, `prefect/v1/flows/${flowId}`);

          let tasksToApply = tasks.filter(ValidateDefaultTasksToApplyInPipeline);

          if (data.transformTasks.length === 0) {
            tasksToApply = [];
          }
          //if "data.transformTasks" and "tasksToApply" are same then the alignment is simple else advanced.
          if (
            data.transformTasks.length > 0 &&
            !data.transformTasks.every(
              (task: { uuid: string; seq: number }, index: number) =>
                task.seq === tasksToApply[index].seq
            )
          ) {
            const uuidOrder = data.transformTasks.reduce((acc: any, obj: any) => {
              acc[obj.uuid] = obj.seq;
              return acc;
            }, {});
            tasksToApply = tasks
              .filter((obj) => uuidOrder.hasOwnProperty(obj.uuid))
              .sort((a, b) => uuidOrder[a.uuid] - uuidOrder[b.uuid]);
            setAlignment('advanced');
          }

          const cronObject = convertCronToString(data.cron);

          reset({
            cron: {
              id: cronObject.schedule,
              label: cronObject.schedule,
            },
            connections: data.connections
              .sort((c1: any, c2: any) => c1.seq - c2.seq)
              .map((conn: any) => ({
                id: conn.id,
                label: conn.name,
              })),
            active: data.isScheduleActive,
            name: data.name,
            tasks: tasksToApply,
            cronDaysOfWeek: cronObject.daysOfWeek.map((day: string) => ({
              id: day,
              label: WEEKDAYS[day],
            })),
            cronTimeOfDay: cronObject.timeOfDay,
          });
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], toastContext);
        }
        setLoading(false);
      })();
    }
  }, [flowId]);

  useEffect(() => {
    (async () => {
      try {
        const data = await httpGet(session, 'airbyte/v1/connections');
        const tempConns: Array<DispConnection> = data.map((conn: Connection) => {
          return {
            id: conn.connectionId,
            label: conn.name,
            name: conn.name,
          };
        });
        setConnectionOptions(tempConns);
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
        data.cronDaysOfWeek.map((option: AutoCompleteOption) => option.id),
        data.cronTimeOfDay
      );
      const selectedConns = data.connections.map((conn: DispConnection, index: number) => ({
        id: conn.id,
        seq: index + 1,
      }));
      if (isEditPage) {
        setLoading(true);
        // hit the set schedule api if the value is updated
        if (dirtyFields?.active) {
          await httpPost(
            session,
            `prefect/flows/${flowId}/set_schedule/${data.active ? 'active' : 'inactive'}`,
            {}
          );
        }

        // hit the update deplyment api if the cron is updated
        await httpPut(session, `prefect/v1/flows/${flowId}`, {
          cron: cronExpression,
          name: data.name,
          connections: selectedConns,
          transformTasks: data.tasks.map((task: TransformTask, index: number) => ({
            uuid: task.uuid,
            seq: index + 1,
          })),
        });
        successToast(`Pipeline ${data.name} updated successfully`, [], toastContext);
        setSelectedFlowId('');
      } else {
        setLoading(true);
        const response = await httpPost(session, 'prefect/v1/flows/', {
          name: data.name,
          connections: selectedConns,
          cron: cronExpression,
          transformTasks: data.tasks.map((task: TransformTask, index: number) => ({
            uuid: task.uuid,
            seq: index + 1,
          })),
        });
        successToast(`Pipeline ${response.name} created successfully`, [], toastContext);
      }
      updateCrudVal('index');
      mutate();
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} data-testid="form">
        <Backdrop open={loading !== undefined ? loading : false} sx={{ zIndex: '100' }}>
          <CircularProgress data-testid="circularprogress" color="info" />
        </Backdrop>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }} variant="h4" gutterBottom color="#000">
            {flowId ? 'Update pipeline' : 'Create a new Pipeline'}
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
            <Button variant="contained" sx={{ m: 1 }} type="submit" data-testid="savebutton">
              Save changes
            </Button>
          </Box>
        </Box>
        <Box
          sx={{
            marginTop: '50px',
            backgroundColor: 'white',
            padding: '33px 50px 33px 30px',
            display: 'flex',
          }}
        >
          <Box sx={{ width: '60%', overflow: 'auto', pl: 4 }}>
            <Typography variant="h5" sx={{ marginBottom: '30px' }} fontWeight={600}>
              Pipeline details
            </Typography>
            <Stack gap="12px" sx={{ maxWidth: '495px', mr: 4 }}>
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
                  <InputLabel sx={{ marginBottom: '5px' }}>Is Active ?</InputLabel>
                </Box>
              )}
              <Box>
                <Input
                  data-testid="name"
                  variant="outlined"
                  register={register}
                  name="name"
                  label="Name"
                  placeholder="Enter the name of your pipeline"
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message}
                ></Input>
              </Box>
              <Box>
                <Controller
                  name="connections"
                  control={control}
                  render={({ field }: any) => {
                    return (
                      <Autocomplete
                        id="connections"
                        multiple
                        ChipProps={{
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          'data-testid': 'connectionchip',
                        }}
                        data-testid="connectionautocomplete"
                        value={field.value}
                        sx={{ marginBottom: '10px' }}
                        options={connectionOptions}
                        isOptionEqualToValue={(option: any, val: any) =>
                          val && option?.id === val?.id
                        }
                        onChange={(e, data) => field.onChange(data)}
                        renderInput={(params) => (
                          <Input
                            {...params}
                            placeholder="Select your connection"
                            name="connections"
                            variant="outlined"
                            label="Connections"
                            error={!!errors.connections}
                            helperText={errors.connections?.message}
                          />
                        )}
                      />
                    );
                  }}
                />
              </Box>
              <Box>
                <InputLabel sx={{ marginBottom: '5px' }}>Transform tasks</InputLabel>

                <ToggleButtonGroup
                  color="primary"
                  sx={{ mt: 1 }}
                  value={alignment}
                  exclusive
                  onChange={handleChange}
                  aria-label="Platform"
                >
                  <ToggleButton sx={{ padding: '4px 11px' }} value="simple">
                    Simple
                  </ToggleButton>
                  <ToggleButton sx={{ padding: '4px 11px' }} value="advanced">
                    Advanced
                  </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ mt: 2 }}>
                  <Controller
                    name="tasks"
                    control={control}
                    render={({ field }) =>
                      alignment === 'simple' ? ( // if its simple
                        <FormControlLabel
                          key={field.name}
                          control={
                            <Checkbox
                              checked={field.value.length > 0}
                              onChange={() => {
                                if (field.value.length > 0) {
                                  field.onChange([]);
                                } else {
                                  field.onChange(
                                    tasks.filter(ValidateDefaultTasksToApplyInPipeline)
                                  );
                                }
                              }}
                            />
                          }
                          label="Run all tasks"
                        />
                      ) : (
                        <TaskSequence field={field} options={tasks} /> // if advanced is selected
                      )
                    }
                  />
                </Box>
              </Box>
            </Stack>
          </Box>
          <Divider orientation="vertical" sx={{ height: 'auto' }} />
          <Box sx={{ width: '40%' }}>
            <Box sx={{ ml: 4 }}>
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
                        { id: 'manual', label: 'manual' },
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
                <Box sx={{ marginBottom: '30px' }}>
                  <Controller
                    name="cronDaysOfWeek"
                    control={control}
                    rules={{ required: 'Day(s) of week is required' }}
                    render={({ field }) => (
                      <Autocomplete
                        id="cronDaysOfWeek"
                        data-testid="cronDaysOfWeek"
                        multiple
                        value={field.value}
                        options={Object.keys(WEEKDAYS).map((key) => ({
                          id: String(key),
                          label: WEEKDAYS[key],
                        }))}
                        isOptionEqualToValue={(option: any, val: any) =>
                          val && option?.id === val?.id
                        }
                        onChange={(e, data: readonly any[]) => field.onChange(data)}
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
              {scheduleSelected && scheduleSelected?.id !== 'manual' ? (
                <Box data-testid="cronTimeOfDay">
                  <InputLabel htmlFor={'cronTimeOfDay'}>
                    Time of day* ({localTimezone()} timezone)
                  </InputLabel>
                  <Controller
                    name="cronTimeOfDay"
                    control={control}
                    rules={{ required: 'Time of day is required' }}
                    render={({ field, fieldState: { error } }) => (
                      <LocalizationProvider dateAdapter={AdapterMoment}>
                        <TimePicker
                          value={moment.utc(field.value, 'HH mm').local()}
                          slotProps={{
                            textField: {
                              variant: 'outlined',
                              error: !!error,
                              helperText: error?.message,
                            },
                          }}
                          onChange={(value: Moment | null) => {
                            // the value will have a local time moment object
                            const utcMinutes = moment.utc(value).minute();
                            const utcHours = moment.utc(value).hours();
                            const time = `${utcHours} ${utcMinutes}`;
                            field.onChange(time);
                          }}
                        />
                      </LocalizationProvider>
                    )}
                  />
                </Box>
              ) : (
                ''
              )}
            </Box>
          </Box>
        </Box>
      </form>
    </>
  );
};

export default FlowCreate;
