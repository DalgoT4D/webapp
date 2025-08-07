import React, { useContext, useEffect, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import useSWR from 'swr';
import { Box, Button, FormControlLabel, Switch } from '@mui/material';
import Input from '../UI/Input/Input';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpPut } from '@/helpers/http';
import InfoTooltip from '../UI/Tooltip/Tooltip';

interface PreferencesFormProps {
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type PreferencesFormInput = {
  enable_email_notifications: boolean;
  enable_discord_notifications: boolean;
  discord_webhook: string;
  subscribe_incident_notifications: boolean;
  subscribe_schema_change_notifications: boolean;
  subscribe_job_failure_notifications: boolean;
  subscribe_late_runs_notifications: boolean;
  subscribe_dbt_test_failure_notifications: boolean;
};

const PreferencesForm = ({ showForm, setShowForm }: PreferencesFormProps) => {
  const { data: session }: any = useSession();
  const { data: preferences, mutate: mutateUserPreferences } = useSWR(`userpreferences/`);
  const { data: orgPreferences, mutate: mutateOrgPreferences } = useSWR(`orgpreferences/`);
  const [loading, setLoading] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);
  const permissions = globalContext?.Permissions?.state || [];
  const {
    handleSubmit,
    register,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreferencesFormInput>();

  useEffect(() => {
    if (preferences && showForm) {
      setValue('enable_email_notifications', preferences.res.enable_email_notifications || false);
      setValue(
        'subscribe_incident_notifications',
        preferences.res.subscribe_incident_notifications || false
      );
      setValue(
        'subscribe_schema_change_notifications',
        preferences.res.subscribe_schema_change_notifications || false
      );
      setValue(
        'subscribe_job_failure_notifications',
        preferences.res.subscribe_job_failure_notifications || false
      );
      setValue(
        'subscribe_late_runs_notifications',
        preferences.res.subscribe_late_runs_notifications || false
      );
      setValue(
        'subscribe_dbt_test_failure_notifications',
        preferences.res.subscribe_dbt_test_failure_notifications || false
      );
    }
    if (orgPreferences && showForm) {
      setValue(
        'enable_discord_notifications',
        orgPreferences.res.enable_discord_notifications || false
      );
      setValue('discord_webhook', orgPreferences.res.discord_webhook || '');
    }
  }, [preferences, orgPreferences, setValue, showForm]);

  const enableDiscordNotifications = watch('enable_discord_notifications');

  const handleClose = () => {
    reset();
    setShowForm(false);
  };

  const formContent = (
    <>
      <Box sx={{ pt: 2, pb: 4 }}>
        <Controller
          name="enable_email_notifications"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label="Enable Email Notifications"
            />
          )}
        />

        <Controller
          name="enable_discord_notifications"
          control={control}
          render={({ field }) => (
            <>
              <FormControlLabel
                control={
                  <Switch
                    {...field}
                    checked={field.value}
                    disabled={!permissions.includes('can_edit_org_notification_settings')}
                  />
                }
                label="Enable Discord Notifications"
              />
              {!permissions.includes('can_edit_org_notification_settings') && (
                <InfoTooltip
                  title={
                    "Please reach out to your organization's Account Manager to enable this feature"
                  }
                />
              )}
            </>
          )}
        />

        {enableDiscordNotifications && (
          <Input
            error={!!errors.discord_webhook}
            helperText={
              !!errors.discord_webhook &&
              'Discord webhook is required to enable discord notifications!'
            }
            sx={{ width: '100%', mt: '1rem' }}
            required
            label="Discord Webhook"
            disabled={!permissions.includes('can_edit_org_notification_settings')}
            variant="outlined"
            register={register}
            name="discord_webhook"
          />
        )}
        <Box sx={{ mt: 4 }}>
          <Box sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>Category Subscriptions</Box>

          <Controller
            name="subscribe_incident_notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Incident Notifications"
              />
            )}
          />

          <Controller
            name="subscribe_schema_change_notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Schema Change Notifications"
              />
            )}
          />

          <Controller
            name="subscribe_job_failure_notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Job Failure Notifications"
              />
            )}
          />

          <Controller
            name="subscribe_late_runs_notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="Late Runs Notifications"
              />
            )}
          />

          <Controller
            name="subscribe_dbt_test_failure_notifications"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch {...field} checked={field.value} />}
                label="dbt Test Failure Notifications"
              />
            )}
          />
        </Box>
      </Box>
    </>
  );

  const onSubmit = async (values: any) => {
    setLoading(true);

    try {
      // Update user preferences (email notifications)
      await httpPut(session, 'userpreferences/', {
        enable_email_notifications: values.enable_email_notifications,
        subscribe_incident_notifications: values.subscribe_incident_notifications,
        subscribe_schema_change_notifications: values.subscribe_schema_change_notifications,
        subscribe_job_failure_notifications: values.subscribe_job_failure_notifications,
        subscribe_late_runs_notifications: values.subscribe_late_runs_notifications,
        subscribe_dbt_test_failure_notifications: values.subscribe_dbt_test_failure_notifications,
      });

      // Update org preferences (Discord settings) only if the user has permission
      if (permissions.includes('can_edit_org_notification_settings')) {
        await httpPut(session, 'orgpreferences/enable-discord-notifications', {
          enable_discord_notifications: values.enable_discord_notifications,
          discord_webhook: values.enable_discord_notifications ? values.discord_webhook : '',
        });

        mutateOrgPreferences(); // Revalidate org preferences
      }

      mutateUserPreferences(); // Revalidate user preferences
      handleClose();
      successToast('Preferences updated successfully.', [], globalContext);
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }

    setLoading(false);
  };

  return (
    <>
      <CustomDialog
        title={'Manage Preferences'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={formContent}
        formActions={
          <Box>
            <Button
              variant="contained"
              type="submit"
              data-testid="savebutton"
              disabled={loading} // Disable button while loading
            >
              Update Preferences
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
        loading={loading}
      />
    </>
  );
};

export default PreferencesForm;
