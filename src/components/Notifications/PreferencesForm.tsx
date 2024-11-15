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

interface PreferencesFormProps {
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type PreferencesFormInput = {
  enable_email_notifications: boolean;
  enable_discord_notifications: boolean;
  discord_webhook: string;
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
            <FormControlLabel
              control={
                <Switch
                  {...field}
                  checked={field.value}
                  disabled={!permissions.includes('can_edit_discord_notifications_settings')}
                />
              }
              label="Enable Discord Notifications"
            />
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
            disabled={!permissions.includes('can_edit_discord_notifications_settings')}
            variant="outlined"
            register={register}
            name="discord_webhook"
          />
        )}
      </Box>
    </>
  );

  const onSubmit = async (values: any) => {
    setLoading(true);

    try {
      // Update user preferences (email notifications)
      await httpPut(session, 'userpreferences/', {
        enable_email_notifications: values.enable_email_notifications,
      });

      // Update org preferences (Discord settings) only if the user has permission
      if (permissions.includes('can_edit_discord_notifications_settings')) {
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
