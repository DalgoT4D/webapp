import { useTracking } from '@/contexts/TrackingContext';
import { httpPost, httpPut } from '@/helpers/http';
import { Box, Button, Dialog, DialogActions, DialogTitle, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
  viz_url: string | null;
  viz_login_type: string | null;
  is_demo: boolean;
};

export const DeactivatedMsg = ({ open, setIsOpen }: { open: boolean; setIsOpen: any }) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);

  const permissions = globalContext?.Permissions.state || [];

  const router = useRouter();
  const trackAmplitudeEvent: any = useTracking();

  const handleEnableButton = async () => {
    if (permissions.includes('can_edit_llm_settings')) {
      router.push('/settings/ai-settings');
      return;
    }
    try {
      const { success, res } = await httpPost(session, 'userpreferences/llm_analysis/request', {});
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
      successToast(res, [], globalContext);
      return;
    } catch (error: any) {
      console.error(error, 'error');
      errorToast(error.message, [], globalContext);
      return;
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={false}
      PaperProps={{
        sx: { borderRadius: '8px', padding: ' 2.3rem 3rem', width: '480px' },
      }}
    >
      <DialogTitle variant="h5" fontWeight={700} sx={{ padding: '0' }}>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>AI Data Analysis Deactivated</Box>
        </Box>
      </DialogTitle>
      <DialogTitle flexGrow={1} sx={{ padding: '0', mt: '1.5rem' }}>
        {permissions.includes('can_edit_llm_settings') ? (
          <Typography sx={{ lineHeight: '26px', color: 'rgba(15, 36, 64, 0.8)' }}>
            This feature is currently disabled. As the account manager, you can enable AI{' '}
            <span style={{ color: 'rgba(0, 137, 123, 1)', fontWeight: 700, fontSize: '1rem' }}>
              Data Analysis
            </span>
            , in the settings page to start using it.
          </Typography>
        ) : (
          <Typography sx={{ lineHeight: '26px', color: 'rgba(15, 36, 64, 0.8)' }}>
            Your account manager has disabled this feature. To use AI{' '}
            <span style={{ color: 'rgba(0, 137, 123, 1)', fontWeight: 700, fontSize: '1rem' }}>
              Data Analysis
            </span>
            , request your account manager to enable it in the settings page.
          </Typography>
        )}
      </DialogTitle>
      <DialogActions
        sx={{
          mt: '27px',
          justifyContent: 'flex-start',
          p: 0,
        }}
      >
        <Button
          onClick={() => {
            trackAmplitudeEvent(`[Enable-LLMAnalysis] Button Clicked`);

            handleEnableButton();
          }}
          variant="contained"
          sx={{ width: '148px' }}
        >
          Enable
        </Button>
      </DialogActions>
    </Dialog>
  );
};
