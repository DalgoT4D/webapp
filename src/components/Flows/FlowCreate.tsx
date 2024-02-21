import { GlobalContext } from '@/contexts/ContextProvider';
import {
  Autocomplete,
  Backdrop,
  Box,
  Button,
  CircularProgress,
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
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import Input from '../UI/Input/Input';
import moment, { Moment } from 'moment';
import { Connection } from '@/components/Connections/Connections';
import { TransformTask } from '../DBT/DBTTarget';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

type DispTransform = {
  orgTaskUUID: string;
  label: string;
};

type DeploymentDef = {
  active: boolean;
  name: string;
  dbtTransform: string;
  connections: Array<any>;
  transformTasks: Array<DispTransform>;
  cron: string | object;
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

  const [connectionOptions, setConnectionOptions] = useState<DispConnection[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { dirtyFields, errors },
    reset,
    watch,
  } = useForm<DeploymentDef>({
    defaultValues: {
      active: true,
      name: '',
      dbtTransform: 'no',
      connections: [],
      transformTasks: [],
      cron: '',
      cronDaysOfWeek: [],
      cronTimeOfDay: '',
    },
  });

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

  const onDragEnd = (oldList: Array<DispTransform>, result: any) => {
    if (!result.destination) return oldList; // Dragged outside the list
    console.log(result.source.index);
    console.log(result.destination.index);

    const reorderedItems = Array.from(oldList);
    const [reorderedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, reorderedItem);

    return reorderedItems;
  };

  useEffect(() => {
    if (flowId) {
      (async () => {
        setLoading(true);
        try {
          const data: any = await httpGet(
            session,
            `prefect/v1/flows/${flowId}`
          );
          const cronObject = convertCronToString(data.cron);
          reset({
            cron: {
              id: cronObject.schedule,
              label: cronObject.schedule,
            },
            dbtTransform: data.dbtTransform,
            transformTasks: data.transformTasks.map((task: any) => ({
              orgTaskUUID: task.uuid,
              label: task.uuid,
            })), // need the label from the backend
            connections: data.connections
              .sort((c1: any, c2: any) => c1.seq - c2.seq)
              .map((conn: any) => ({
                id: conn.id,
                label: conn.name,
              })),
            active: data.isScheduleActive,
            name: data.name,
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
        const tempConns: Array<DispConnection> = data.map(
          (conn: Connection) => {
            return {
              id: conn.connectionId,
              label: conn.name,
              name: conn.name,
            };
          }
        );
        setConnectionOptions(tempConns);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], toastContext);
      }
    })();
  }, []);

  const availableTransformTasks = [
    { orgTaskUUID: '7d80bc12-84d7-4ff3-b1fa-8754677b258e', label: 'git-pull' },
    { orgTaskUUID: '97dfd6b9-0d1b-4f20-bc67-4d2ff1c18b7a', label: 'dbt-clean' },
    { orgTaskUUID: '079a9d6b-1492-44d2-b2e6-7b605c733a0f', label: 'dbt-deps' },
    { orgTaskUUID: 'a4167137-ec59-46c2-bcb3-ad81297adb76', label: 'dbt-run' },
    { orgTaskUUID: '852a6677-0bde-44db-a549-f52320475b98', label: 'dbt-test' },
  ];

  const onSubmit = async (data: any) => {
    try {
      const cronExpression = convertToCronExpression(
        data.cron.id,
        data.cronDaysOfWeek.map((option: AutoCompleteOption) => option.id),
        data.cronTimeOfDay
      );
      const selectedConns = data.connections.map(
        (conn: DispConnection, index: number) => ({
          id: conn.id,
          seq: index + 1,
        })
      );
      if (isEditPage) {
        setLoading(true);
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
        await httpPut(session, `prefect/v1/flows/${flowId}`, {
          cron: cronExpression,
          name: data.name,
          connections: selectedConns,
          dbtTransform: data.dbtTransform,
          transformTasks:
            tasks && data.dbtTransform === 'yes'
              ? tasks
                  // remove this filter
                  .filter(
                    (task: TransformTask) => task.generated_by === 'system'
                  )
                  .map((task: TransformTask) => ({
                    uuid: task.uuid,
                    seq: task.seq,
                  }))
              : [],
        });
        successToast(
          `Pipeline ${data.name} updated successfully`,
          [],
          toastContext
        );
        setSelectedFlowId('');
      } else {
        setLoading(true);
        const response = await httpPost(session, 'prefect/v1/flows/', {
          name: data.name,
          connections: selectedConns,
          dbtTransform: data.dbtTransform,
          cron: cronExpression,
          transformTasks:
            tasks && data.dbtTransform === 'yes'
              ? tasks
                  // remove this filter
                  .filter(
                    (task: TransformTask) => task.generated_by === 'system'
                  )
                  .map((task: TransformTask) => ({
                    uuid: task.uuid,
                    seq: task.seq,
                  }))
              : [],
        });
        successToast(
          `Pipeline ${response.name} created successfully`,
          [],
          toastContext
        );
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
        <Backdrop
          open={loading !== undefined ? loading : false}
          sx={{ zIndex: '100' }}
        >
          <CircularProgress data-testid="circularprogress" color="info" />
        </Backdrop>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            sx={{ fontWeight: 700 }}
            variant="h4"
            gutterBottom
            color="#000"
          >
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
              Pipeline details
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
                        sx={{ marginBottom: '10px', width: '90%' }}
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
                            required
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
                <Controller
                  name="transformTasks"
                  control={control}
                  render={({ field }) => (
                    <>
                      {availableTransformTasks.map(
                        (task: DispTransform, index: number) => {
                          return (
                            <Button
                              key={`add-task-${index}`}
                              onClick={() => {
                                const newTasks = field.value;
                                newTasks.push(task);
                                field.onChange(newTasks);
                              }}
                            >
                              {task.label}
                            </Button>
                          );
                        }
                      )}

                      <DragDropContext
                        onDragEnd={(result: any) => {
                          field.onChange(onDragEnd(field.value, result));
                        }}
                      >
                        <Droppable droppableId="droppable">
                          {(provided: any) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {field.value.map(
                                (task: DispTransform, index: number) => {
                                  return (
                                    <Draggable
                                      key={`${index}${task.orgTaskUUID}`}
                                      draggableId={task.orgTaskUUID}
                                      index={index}
                                    >
                                      {(provided: any) => (
                                        <Box
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '2px',
                                            padding: '3px',
                                          }}
                                        >
                                          <Typography>
                                            {task.label} having index {index}
                                          </Typography>
                                          <Button
                                            onClick={() => {
                                              const newValue = [
                                                ...field.value.slice(0, index),
                                                ...field.value.slice(index + 1),
                                              ];
                                              field.onChange(newValue);
                                            }}
                                          >
                                            Remove
                                          </Button>
                                        </Box>
                                      )}
                                    </Draggable>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </>
                  )}
                ></Controller>
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
                      onChange={(e, data: readonly any[]) =>
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
            {scheduleSelected && scheduleSelected?.id !== 'manual' ? (
              <Box data-testid="cronTimeOfDay">
                <InputLabel htmlFor={'cronTimeOfDay'}>Time of day*</InputLabel>
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
      </form>
    </>
  );
};

export default FlowCreate;
