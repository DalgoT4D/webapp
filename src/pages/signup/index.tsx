import { Box, Button, TextField, Link, Divider } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Auth from '@/components/Layouts/Auth';
import { signIn } from 'next-auth/react';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

export const SignUp = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  if (session?.user.token) {
    router.push('/');
  }
  const { register, handleSubmit } = useForm();
  const toastContext = useContext(GlobalContext);

  const onSubmit = async (data: any) => {
    try {
      await httpPost(session, 'organizations/users/', {
        email: data.username,
        password: data.password,
        signupcode: data.signupcode,
      });
      signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: true,
        callbackUrl: '/signup/createorg',
      });
    } catch (err: any) {
      console.error(err);
      errorToast(err.cause.detail, [], toastContext);
    }
  };

  return (
    <Auth
      heading="Create an account"
      subHeading="Please enter correct registration details below"
    >
      <form onSubmit={handleSubmit(onSubmit)} data-testid="signup-form">
        <Box className={styles.Container}>
          <TextField
            sx={{ width: '100%', pb: 3, mt: 2 }}
            id="outlined-basic"
            data-testid="username"
            label="Business email"
            variant="outlined"
            {...register('username', { required: true })}
          />

          <TextField
            sx={{ width: '100%', pb: 3 }}
            id="outlined-password-input"
            data-testid="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: true })}
          />

          <TextField
            sx={{ width: '100%', pb: 3 }}
            id="outlined-basic"
            label="Signup code"
            variant="outlined"
            {...register('signupcode', { required: true })}
          />
          <Button
            sx={{ width: '100%', mb: 3 }}
            variant="contained"
            type="submit"
            data-testid="submit"
          >
            Sign Up
          </Button>
          <Divider>OR</Divider>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            Already a member?{' '}
            <Link href="/login" sx={{ textDecoration: 'none' }}>
              Log in
            </Link>
          </Box>
        </Box>
      </form>
    </Auth>
  );
};

export default SignUp;
