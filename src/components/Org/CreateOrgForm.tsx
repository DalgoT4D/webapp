import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import Input from '@/components/UI/Input/Input';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialog from '../Dialog/CustomDialog';
import moment from 'moment';
interface CreateOrgFormProps {
  closeSideMenu: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

const OrgPlan = {
  DALGO: 'Dalgo',
  DALGO_SUPERSET: 'Dalgo + Superset',
  FREE_TRIAL: 'Free Trial',
};
const Duration = {
  MONTHLY: 'Monthly',
  ANNUAL: 'Annual',
};

const Static_Payload: any = {
  [OrgPlan.DALGO]: {
    base_plan: 'DALGO',
    superset_included: true,
    can_upgrade_plan: true,
  },
  [OrgPlan.DALGO_SUPERSET]: {
    base_plan: 'DALGO',
    superset_included: true,
    can_upgrade_plan: false,
  },
  [OrgPlan.FREE_TRIAL]: {
    base_plan: 'Free trial',
    superset_included: true,
    can_upgrade_plan: true,
  },
};

export const CreateOrgForm = ({ closeSideMenu, showForm, setShowForm }: CreateOrgFormProps) => {
  const { data: session }: any = useSession();
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);
  const [newlyCreatedOrg, setNewlyCreatedOrg] = useState<string>('');
  const [planOptions] = useState([OrgPlan.DALGO, OrgPlan.DALGO_SUPERSET, OrgPlan.FREE_TRIAL]);
  const [durationOptions] = useState([Duration.MONTHLY, Duration.ANNUAL]);
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
      planType: '',
      duration: '',
      startDate: '',
      endDate: '',
    },
  });
  const globalContext = useContext(GlobalContext);

  const handleClose = () => {
    reset();
    setShowForm(false);
    closeSideMenu();
  };

  const onSubmit = async (data: any) => {
    let payload = Static_Payload[data.planType];
    payload = {
      ...payload,
      name: data.name,
      subscription_duration: data.duration,
      start_date: new Date(data.startDate).toISOString(),
      end_date: new Date(data.endDate).toISOString(),
    };
    setWaitForOrgCreation(true);
    try {
      const res = await httpPost(session, 'v1/organizations/', payload);
      if (res?.slug) {
        setNewlyCreatedOrg(res.slug);
      }
      handleClose();
      successToast('Organization created successfully!', [], globalContext);
      setWaitForOrgCreation(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setWaitForOrgCreation(false);
  };

  useEffect(() => {
    if (newlyCreatedOrg) localStorage.setItem('org-slug', newlyCreatedOrg);
  }, [newlyCreatedOrg]);

  const planType = watch('planType');
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
              error={!!errors.name}
              helperText={errors.name?.message}
              sx={{ mb: 2, width: '100%' }}
              label="Organization Name"
              variant="outlined"
            />
          )}
        />

        {/* Plan Type */}
        <Controller
          name="planType"
          control={control}
          rules={{ required: 'Plan type is required' }}
          render={({ field }) => (
            <Autocomplete
              options={planOptions}
              value={field.value || null}
              onChange={(e, data) => {
                field.onChange(data);
                if (data === OrgPlan.FREE_TRIAL) {
                  setValue('duration', 'Trial');
                } else {
                  setValue('duration', '');
                }
              }}
              renderInput={(params) => (
                <Input
                  {...params}
                  error={!!errors.planType}
                  helperText={errors.planType?.message}
                  sx={{ mb: 2, width: '100%' }}
                  label="Select Plan Type"
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
              value={planType === OrgPlan.FREE_TRIAL ? 'Trial' : field.value || null}
              disabled={planType === 'Free Trial'}
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
          rules={{ required: 'Start date is required' }}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
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
            required: 'End date is required',
            validate: (value) => {
              const startDate = watch('startDate'); // Watch the startDate field
              if (!startDate) {
                return 'Please select a valid start date first.';
              }
              const isValid = moment(value).isAfter(moment(startDate));
              return isValid || 'End date must be after start date.';
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              error={!!errors.endDate}
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
