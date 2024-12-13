import { Autocomplete, Box, Button, InputLabel, List } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ListItem from '@mui/material/ListItem';
import CustomDialog from '../Dialog/CustomDialog';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import Input from '../UI/Input/Input';
import { TASK_GITPULL, TASK_DBTCLEAN, TASK_DOCSGENERATE } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { httpGet, httpPost } from '@/helpers/http';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { useTracking } from '@/contexts/TrackingContext';

interface CreateOrgTaskFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

interface MasterTask {
  type: string;
  label: string;
  slug: string;
  command: string;
  is_system: boolean;
}

interface MasterTaskConfig {
  flags: Array<string>;
  options: Array<string>;
}

interface AutocompleteOption {
  id: string;
  label: string;
}

const Command = ({ task, flags, options }: any) => {
  return (
    task && (
      <Box>
        Command:{' '}
        {task.id.replace('-', ' ') + ' ' + flags.map((flag: string) => '--' + flag).join(' ') + ' '}
        {options.current &&
          options.current.length > 0 &&
          options.current
            .filter((opt: any) => opt.key && opt.value)
            .map((opt: any) => '--' + opt.key + ' ' + opt.value)
            .join(' ')}
      </Box>
    )
  );
};

const CreateOrgTaskForm = ({ mutate, showForm, setShowForm }: CreateOrgTaskFormProps) => {
  const { data: session }: any = useSession();
  const optionsRef = useRef<any>([]);
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [masterTasks, setMasterTasks] = useState<Array<AutocompleteOption>>([]);
  const [masterFlags, setMasterFlags] = useState<Array<string>>([]);
  const [masterOptions, setMasterOptions] = useState<any>({});
  const trackAmplitudeEvent = useTracking();
  const { register, handleSubmit, control, watch, reset, setValue, getValues } = useForm({
    defaultValues: {
      task_slug: { label: '', id: '' },
      flags: [],
      options: [{ key: '', value: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray<any>({
    control,
    name: 'options',
  });

  const selectedTask: AutocompleteOption = watch('task_slug');
  const selectedFlags = watch('flags');
  optionsRef.current = watch('options');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data: Array<MasterTask> = await httpGet(session, `data/tasks/`);
        const tasksDropDownRows = data
          .filter((task: MasterTask) => ![TASK_GITPULL, TASK_DBTCLEAN].includes(task.slug))
          .map((task: MasterTask) => {
            return { id: task.slug, label: task.slug };
          });
        console.log(tasksDropDownRows, 'taskdropdown');
        setMasterTasks([...tasksDropDownRows, { id: 'dbt-cloud', label: 'dbt-cloud' }]);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (selectedTask?.id) {
      (async () => {
        setValue('flags', []);
        setValue('options', []);
        setLoading(true);
        try {
          const data: MasterTaskConfig = await httpGet(
            session,
            `data/tasks/${selectedTask.id}/config/`
          );

          setMasterFlags(data?.flags);
          setMasterOptions(data?.options);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
        setLoading(false);
      })();
    } else {
      setMasterFlags([]);
      setMasterOptions([]);
    }
  }, [selectedTask]);

  const handleFormClose = () => {
    reset();
    setShowForm(false);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    trackAmplitudeEvent('[Save-OrgTask] Button Clicked');
    const paramOptions: any = {};
    data.options
      .filter((opt: any) => opt.key && opt.value)
      .forEach((opt: { key: string; value: string }) => {
        paramOptions[opt.key] = opt.value;
      });

    try {
      await httpPost(session, `prefect/tasks/`, {
        task_slug: data.task_slug.id,
        flags: data.flags,
        options: paramOptions,
      });
      handleFormClose();
      mutate();
      successToast('Org Task created successfully', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  const FormContent = () => {
    return (
      <>
        <Box sx={{ pt: 2, pb: 4 }}>
          <Controller
            name="task_slug"
            control={control}
            rules={{ required: true }}
            render={({ field }: any) => (
              <Autocomplete
                data-testid="taskList"
                options={masterTasks}
                aria-labelledby="Select task"
                value={field.value}
                onChange={(e, data) => field.onChange(data)}
                renderInput={(params) => (
                  <Input
                    {...params}
                    data-testid="selecttask"
                    label="Select task"
                    aria-labelledby="Select task"
                    variant="outlined"
                  />
                )}
              />
            )}
          />
          <Box sx={{ m: 2 }} />
          <Controller
            name="flags"
            control={control}
            render={({ field }: any) => {
              return (
                <Autocomplete
                  id="flags"
                  multiple
                  ChipProps={{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    'data-testid': 'connectionchip',
                  }}
                  data-testid="connectionautocomplete"
                  value={field.value}
                  sx={{ marginBottom: '10px', width: '100%' }}
                  options={masterFlags}
                  isOptionEqualToValue={(option: any, val: any) => val && option?.id === val?.id}
                  onChange={(e, data) => field.onChange(data)}
                  renderInput={(params) => (
                    <Input
                      {...params}
                      placeholder="Select flags"
                      name="flags"
                      variant="outlined"
                      label="Flags"
                    />
                  )}
                />
              );
            }}
          />
          <Box sx={{ m: 2 }} />
          <Box>
            <InputLabel>Options</InputLabel>
            <List sx={{ padding: '0' }}>
              {fields.map((item, index) => {
                return (
                  <ListItem
                    key={item.id}
                    sx={{
                      display: 'flex',
                      gap: '10px',
                      margin: '0',
                      padding: '0',
                    }}
                  >
                    <Controller
                      name={`options.${index}.key`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field }: any) => (
                        <Autocomplete
                          disabled={fields.length - 1 !== index}
                          sx={{ width: '50%' }}
                          data-testid="optionsList"
                          options={masterOptions}
                          value={field.value}
                          onChange={(e, data) => field.onChange(data)}
                          renderInput={(params) => (
                            <Input {...params} label="" variant="outlined" />
                          )}
                        />
                      )}
                    />
                    <Input
                      name={`options.${index}.value`}
                      disabled={fields.length - 1 !== index}
                      data-testid={'option-' + item.id}
                      sx={{ width: '50%' }}
                      label=""
                      variant="outlined"
                      register={register}
                      autoFocus
                    ></Input>

                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        remove(index);
                        optionsRef.current = getValues()['options'];
                      }}
                    >
                      <DeleteIcon />
                    </Button>
                  </ListItem>
                );
              })}
              <Button
                type="button"
                variant="outlined"
                sx={{ marginTop: '10px' }}
                onClick={() => {
                  optionsRef.current = getValues()['options'];
                  append({ key: '', value: '' });
                }}
              >
                <AddIcon />
              </Button>
            </List>
          </Box>

          <Box sx={{ m: 2 }} />
          <InputLabel>
            <Command task={selectedTask} flags={selectedFlags} options={optionsRef} />
          </InputLabel>
        </Box>
      </>
    );
  };

  return (
    <>
      <CustomDialog
        maxWidth={false}
        data-testid="dialog"
        title={'Add a new org task'}
        show={showForm}
        handleClose={handleFormClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={<FormContent />}
        formActions={
          <>
            <Button variant="contained" type="submit">
              Save
            </Button>
            <Button color="secondary" variant="outlined" onClick={handleFormClose}>
              Cancel
            </Button>
          </>
        }
        loading={loading}
      ></CustomDialog>
    </>
  );
};

export default CreateOrgTaskForm;
