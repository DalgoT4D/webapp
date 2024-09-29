import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import styles from '@/styles/Login.module.css';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import Input from '@/components/UI/Input/Input';
import Auth from '@/components/Layouts/Auth';
import { httpPost } from '../../helpers/http';
import { PageHead } from '@/components/PageHead';

export const ResetPassword = () => {
  const { register, handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken: string | null = searchParams.get('token');
    setToken(urlToken);
  }, []);

  const onSubmit = async (reqData: any) => {
    try {
      if (!token) {
        errorToast('This password reset link is invalid', [], toastContext);
        return;
      }
      await httpPost(session, 'users/reset_password/', {
        token: token,
        password: reqData.password,
      });
      router.push('/login');
    } catch (error: any) {
      errorToast(error.cause.detail[0].msg, [], toastContext);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | Reset Password" />
      <Auth heading="Set password" subHeading="Please enter your new password">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
          <Box className={styles.Container}>
            <Input
              sx={{ width: '100%', pb: 2 }}
              id="outlined-basic"
              data-testid="password"
              label="Password"
              type="password"
              required
              register={register}
              name="password"
            />

            <Button
              variant="contained"
              sx={{ width: '100%', mb: 3, minHeight: '50px' }}
              type="submit"
              data-testid="submit"
            >
              Set Password
            </Button>
          </Box>
        </form>
      </Auth>
    </>
  );
};

export default ResetPassword;
