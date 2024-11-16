import { Disclaimer } from '@/components/DataAnalysis/Disclaimer';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import InfoTooltip from '@/components/UI/Tooltip/Tooltip';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPut } from '@/helpers/http';
import { Box, CircularProgress, Switch, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useState } from 'react';

export const AIEnablePanel = () => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [orgPreference, setOrgPreference] = useState<any>([]);
  const [llm_optin, setllm_optin] = useState(false);
  const [openDisclaimer, setOpenDisclaimer] = useState(false);
  const [loading, setLoading] = useState(false);
  const permissions = globalContext?.Permissions.state || [];

  const approve_disapprove_llm = async () => {
    if (!llm_optin && !orgPreference.llm_optin && !openDisclaimer) {
      setOpenDisclaimer(true);
      return;
    }

    try {
      const { success } = await httpPut(session, `orgpreferences/llm_approval`, {
        llm_optin: !orgPreference?.llm_optin,
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
  const fetchOrgPreference = async () => {
    setLoading(true);
    try {
      const { success, res } = await httpGet(session, `orgpreferences/`);
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
      setOrgPreference(res);
      setllm_optin(res.llm_optin);
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (session && !openDisclaimer) {
      fetchOrgPreference();
    }
  }, [session, openDisclaimer]);

  return (
    <>
      <Typography
        sx={{ color: '#7D8998', fontWeight: '700', fontSize: '14px', margin: '40px 0 12px 0' }}
      >
        Details
      </Typography>
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box display={'flex'} alignItems={'center'}>
              {!permissions.includes('can_edit_llm_settings') && (
                <InfoTooltip title={'You currently do not have access to modify this setting.'} />
              )}
              <Switch
                data-testid={`enable-disable-llm`}
                disabled={!permissions.includes('can_edit_llm_settings')}
                checked={llm_optin ? true : false}
                value={llm_optin}
                onChange={approve_disapprove_llm}
              />
            </Box>
          )}
        </Box>
      </Box>
      {openDisclaimer && (
        <Disclaimer open={openDisclaimer} setIsOpen={setOpenDisclaimer} isOrgPrefernce={true} />
      )}
    </>
  );
};
