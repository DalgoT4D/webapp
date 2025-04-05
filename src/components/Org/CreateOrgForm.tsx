import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpGet, httpPost } from '@/helpers/http';
import Input from '@/components/UI/Input/Input';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialog from '../Dialog/CustomDialog';
import { delay } from '@/utils/common';

interface CreateOrgFormProps {
  closeSideMenu: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

const OrgPlan = {
  DALGO: 'Dalgo',
  FREE_TRIAL: 'Free Trial',
  INTERNAL: 'Internal',
};
const Duration = {
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
  TRIAL: 'Trial',
};

export const CreateOrgForm = ({ closeSideMenu, showForm, setShowForm }: CreateOrgFormProps) => {
  const { data: session }: any = useSession();
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);
  const [newlyCreatedOrg, setNewlyCreatedOrg] = useState<string>('');
  const [planOptions] = useState([OrgPlan.DALGO, OrgPlan.FREE_TRIAL, OrgPlan.INTERNAL]);
  const [durationOptions] = useState([Duration.MONTHLY, Duration.ANNUAL, Duration.TRIAL]);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      base_plan: '', //DALGO , Free trail and Internal
      email: '',
      superset_ec2_machine_id: '',
      superset_port: '',
      superset_included: '',
      duration: '',
      startDate: '',
      endDate: '',
    },
  });
  const base_plan = watch('base_plan');
  const globalContext = useContext(GlobalContext);

  const handleClose = () => {
    reset();
    setShowForm(false);
    closeSideMenu();
  };

  const pollForTaskRun = async (taskId: string) => {
    const response = await httpGet(session, `/celery/${taskId}`);
    if (!['completed', 'failed'].includes(response?.status)) {
      await delay(3000);
      await pollForTaskRun(taskId);
    } else if (response?.status === 'failed') {
      errorToast(response?.message, [], globalContext);
      return;
    } else if (response?.status === 'completed') {
      return;
    } else {
      throw new Error('Error while running the task.');
    }
  };

  const onSubmit = async (data: any) => {
    const payload = {
      name: data.name,
      base_plan: data.base_plan,
      subscription_duration: data.duration,
      can_upgrade_plan:
        !data.superset_included || data.base_plan === OrgPlan.FREE_TRIAL ? true : false,
      superset_included: data.superset_included === 'Yes' ? true : false,
      start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
      end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
    };
    setWaitForOrgCreation(true);
    try {
      if (data.base_plan === OrgPlan.FREE_TRIAL) {
        const res = await httpPost(session, 'v1/organizations/free_trial', {
          ...payload,
          superset_ec2_machine_id: data.superset_ec2_machine_id,
          superset_port: data.superset_port,
          email: data.email,
        });
        if (!res?.task_id) {
          errorToast('Failed to create a task', [], globalContext);
          return;
        }
        await pollForTaskRun(res?.task_id);
      } else {
        const res = await httpPost(session, 'v1/organizations/', payload);
        if (res?.slug) {
          setNewlyCreatedOrg(res.slug);
        }
      }
      handleClose();
      successToast('Organization created successfully!', [], globalContext);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    } finally {
      setWaitForOrgCreation(false);
    }
  };

  useEffect(() => {
    if (newlyCreatedOrg) localStorage.setItem('org-slug', newlyCreatedOrg);
  }, [newlyCreatedOrg]);

  const formContent = (
    <>
      <Box sx={{ mt: 2 }}>
        {/* Organization Name */}
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Organization name is required' }}
          render={({ field }) => (
            <Input
              {...field}
              data-testid="input-orgname"
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2, width: '100%' }}
              label="Organization Name"
              variant="outlined"
            />
          )}
        />
        {/* Org type */}

        {/* Plan Type */}
        <Controller
          name="base_plan"
          control={control}
          rules={{ required: 'Plan type is required' }}
          render={({ field }) => (
            <Autocomplete
              options={planOptions}
              data-testid="baseplan"
              value={field.value || null}
              onChange={(e, data) => {
                field.onChange(data);
                if (data === OrgPlan.FREE_TRIAL) {
                  setValue('duration', 'Trial');
                } else {
                  setValue('duration', '');
                  setValue('email', '');
                }
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  error={!!errors.base_plan}
                  helperText={errors.base_plan?.message}
                  sx={{ mb: 2, width: '100%' }}
                  label="Select Plan Type"
                  variant="outlined"
                />
              )}
            />
          )}
        />

        {/* Account manager's email: To send the credentials to the account manager conducting the POC */}
        {base_plan === OrgPlan.FREE_TRIAL && (
          <Controller
            name="email"
            control={control}
            rules={{
              required: 'Account manager email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                data-testid="input-email"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2, width: '100%' }}
                label="Email - Account Manager"
                variant="outlined"
              />
            )}
          />
        )}
        {/* superset ec2 machine id */}
        {base_plan === OrgPlan.FREE_TRIAL && (
          <Controller
            name="superset_ec2_machine_id"
            control={control}
            rules={{
              required: 'Superset ec2 machine id is required',
            }}
            render={({ field }) => (
              <Input
                {...field}
                data-testid="input-superset_ec2_machine_id"
                error={!!errors.superset_ec2_machine_id}
                helperText={errors.superset_ec2_machine_id?.message}
                sx={{ mb: 2, width: '100%' }}
                label="Superset EC2 Machine ID"
                variant="outlined"
              />
            )}
          />
        )}
        {/* superset port */}
        {base_plan === OrgPlan.FREE_TRIAL && (
          <Controller
            name="superset_port"
            control={control}
            rules={{
              required: 'Superset port is required',
            }}
            render={({ field }) => (
              <Input
                {...field}
                data-testid="input-superset_port"
                type="number"
                error={!!errors.superset_port}
                helperText={errors.superset_port?.message}
                sx={{ mb: 2, width: '100%' }}
                label="Superset Port"
                variant="outlined"
              />
            )}
          />
        )}
        {/* Superset included */}
        <Controller
          name="superset_included"
          control={control}
          rules={{ required: 'Please select if Superset is included' }}
          render={({ field }) => (
            <Autocomplete
              options={['Yes', 'No']}
              data-testid="superset_included"
              value={field.value || null}
              onChange={(e, data) => field.onChange(data)} // Update the value
              renderInput={(params) => (
                <Input
                  {...params}
                  error={!!errors.superset_included}
                  helperText={errors.superset_included?.message}
                  sx={{ mb: 2, width: '100%' }}
                  label="Is Superset Included?"
                  variant="outlined"
                />
              )}
            />
          )}
        />

        {/* Duration */}
        <Controller
          name="duration"
          control={control}
          rules={{ required: 'Duration is required' }}
          render={({ field }) => (
            <Autocomplete
              options={durationOptions}
              data-testid="duration"
              value={field.value}
              onChange={(e, data) => field.onChange(data)}
              renderInput={(params) => (
                <Input
                  {...params}
                  error={!!errors.duration}
                  helperText={errors.duration?.message}
                  sx={{ mb: 2, width: '100%' }}
                  label="Select Duration"
                  variant="outlined"
                />
              )}
            />
          )}
        />

        {/* Start Date */}
        <Controller
          name="startDate"
          control={control}
          rules={{
            validate: (value) => {
              const basePlan = watch('base_plan');
              if (basePlan === OrgPlan.FREE_TRIAL && !value) {
                return 'Start date is required for trial accounts';
              }
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              data-testid="startDate"
              error={!!errors.startDate}
              helperText={errors.startDate?.message}
              sx={{ mb: 2, width: '100%' }}
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          )}
        />

        {/* End Date */}
        <Controller
          name="endDate"
          control={control}
          rules={{
            validate: (value) => {
              const basePlan = watch('base_plan');
              if (basePlan == OrgPlan.FREE_TRIAL && !value) {
                return 'End Date is required for trial accounts';
              }
              // if (value) {
              //   const startDate = watch('startDate'); // Watch the startDate field
              //   if (!startDate) {
              //     return 'Please select start date first.';
              //   }
              //   const isValid = moment(value).isAfter(moment(startDate));
              //   return isValid || 'End date must be after start date.';
              // }
              return true;
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              error={!!errors.endDate}
              data-testid="endDate"
              helperText={errors.endDate?.message}
              sx={{ mb: 2, width: '100%' }}
              label="End Date"
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          )}
        />
      </Box>
    </>
  );

  return (
    <>
      <CustomDialog
        title={'Add a new organization'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={formContent}
        formActions={
          <Box>
            <Button variant="contained" type="submit" data-testid="savebutton">
              Save
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancelbutton"
              sx={{ marginLeft: '5px' }}
            >
              Cancel
            </Button>
          </Box>
        }
        loading={waitForOrgCreation}
      />
    </>
  );
};

export default CreateOrgForm;
