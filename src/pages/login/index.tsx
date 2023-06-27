import { Box, Button, Link, Divider } from '@mui/material';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import styles from '@/styles/Login.module.css';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import Input from '@/components/UI/Input/Input';

export const Login = () => {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);

  const onSubmit = async (reqData: any) => {
    const res: any = await signIn('credentials', {
      username: reqData.username,
      password: reqData.password,
      redirect: false,
      callbackUrl: '/',
    });
    if (res.ok) {
      router.push('/pipeline');
      successToast('User logged in successfully', [], context);
    } else {
      errorToast(
        'Something went wrong. Please check your credentials',
        [],
        context
      );
    }
  };

  return (
    !session?.user?.token && (
      <Auth
        heading="Log In"
        subHeading="Please enter correct login details below"
      >
        <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
          <Box className={styles.Container}>
            <Input
              sx={{ width: '100%', pb: 2 }}
              id="outlined-basic"
              data-testid="username"
              label="Business email"
              placeholder="eg. user@domain.com"
              variant="outlined"
              required
              register={register}
              name="username"
            />
            <Input
              required
              sx={{ width: '100%', pb: 4 }}
              id="outlined-password-input"
              data-testid="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              register={register}
              name="password"
            />

            <Button
              variant="contained"
              sx={{ width: '100%', mb: 3, minHeight: '50px' }}
              type="submit"
              data-testid="submit"
            >
              Login
            </Button>
            <Divider>OR</Divider>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              Not a member?{' '}
              <Link href="/signup" sx={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              Forgot password?{' '}
              <Link href="/forgotpassword" sx={{ textDecoration: 'none' }}>
                Reset
              </Link>
            </Box>
          </Box>
        </form>
      </Auth>
    )
  );
};

export default Login;
