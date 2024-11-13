import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { SettingsContext } from '@/contexts/SettingsContext';
import { httpPut } from '@/helpers/http';
import { Box, CircularProgress, Switch, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useState } from 'react';

export const AIEnablePanel = () => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const settingsContext: any = useContext(SettingsContext);
  const { orgPreference, userSettings, fetchOrgPreference, fetchUserSettings } = settingsContext;
  console.log(orgPreference, 'orgPreference');
  const { data: orgPreferenceData, loading } = orgPreference;
  const permissions = globalContext?.Permissions.state || [];

  const approve_disapprove_llm = async () => {
    try {
      const { success, res } = await httpPut(session, `orgpreferences/11/llm_approval`, {
        llm_optin: !orgPreferenceData.llm_optin,
      });
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
      fetchOrgPreference();
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    }
  };
  useEffect(() => {
    if (session) {
      fetchOrgPreference();
    }
  }, [session]);

  return (
    <>
      <Typography
        sx={{ color: '#7D8998', fontWeight: '700', fontSize: '14px', margin: '40px 0 12px 0' }}
      >
        Details
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            boxShadow: '0px 4px 8px 0px rgba(9, 37, 64, 0.08)',
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '30px 48px 30px 40px',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '50%' }}>
            <Typography sx={{ color: '#0F2440E0', fontWeight: 700, fontSize: '20px' }}>
              Enable LLM function for data analysis
            </Typography>
            <Typography sx={{ color: 'rgba(15, 36, 64, 0.68)', fontSize: '14px', fontWeight: 500 }}>
              I consent and grant permission for this information to be shared with the OpenAI
              platform in order to produce the necessary data
            </Typography>
          </Box>
          <Box>
            <Switch
              data-testid={`enable-disable-llm`}
              disabled={!permissions.includes('can_edit_llm_settings')}
              checked={orgPreferenceData?.llm_optin}
              value={orgPreferenceData?.llm_optin}
              onChange={approve_disapprove_llm}
            />
          </Box>
        </Box>
      )}
    </>
  );
};
