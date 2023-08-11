import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import { httpGet } from '../../helpers/http';

export const VerifyEmailResend = () => {
  const { handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const onSubmit = async () => {
    try {
      await httpGet(session, 'users/verify_email/resend');
      successToast('Verification email sent to your inbox', [], globalContext);
    } catch (error: any) {
      console.log(error);
      errorToast(error.cause.detail, [], globalContext);
    }
  };

  return (
    <Auth
      heading="Send verification email"
      subHeading="Click here if you haven't received the verification email"
    >
      <form onSubmit={handleSubmit(onSubmit)} data-testid="resend-email-form">
        <Box className={styles.Container}>
          <Button
            variant="contained"
            sx={{ width: '100%', mb: 3, minHeight: '50px' }}
            type="submit"
            data-testid="submit"
          >
            Send
          </Button>
        </Box>
      </form>
    </Auth>
  );
};

export default VerifyEmailResend;
