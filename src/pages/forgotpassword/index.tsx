import { Box, Button, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import styles from '@/styles/Login.module.css';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Input from '@/components/UI/Input/Input';
import Auth from '@/components/Layouts/Auth';
import { httpPost } from '../../helpers/http';
import { PageHead } from '@/components/PageHead';

export const ForgotPassword = () => {
  const { register, handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const onSubmit = async (reqData: any) => {
    try {
      await httpPost(session, 'users/forgot_password/', {
        email: reqData.email,
      });
      setEmailSent(true);
      successToast('Please check your email', [], toastContext);
    } catch (error) {
      errorToast('Something went wrong...', [], toastContext);
    }
  };

  if (emailSent) {
    return (
      <Auth heading="Forgot password" subHeading="">
        <Box className={styles.Container}>
          <Typography variant="h6" style={{ textAlign: 'center' }}>
            Please check your mailbox for a reset link
          </Typography>
        </Box>
      </Auth>
    );
  } else {
    return (
      <>
        <PageHead title="Dalgo | Forgot Password" />
        <Auth heading="Forgot password" subHeading="">
          <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
            <Box className={styles.Container}>
              <Input
                sx={{ width: '100%', pb: 2 }}
                id="outlined-basic"
                data-testid="email"
                label="Enter your registered email"
                variant="outlined"
                required
                register={register}
                name="email"
              />

              <Button
                variant="contained"
                sx={{ width: '100%', mb: 3, minHeight: '50px' }}
                type="submit"
                data-testid="submit"
              >
                Continue
              </Button>
            </Box>
          </form>
        </Auth>
      </>
    );
  }
};

export default ForgotPassword;
