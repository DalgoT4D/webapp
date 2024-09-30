import {
  Box,
  Button,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import styles from '@/styles/Login.module.css';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import Input from '@/components/UI/Input/Input';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { PageHead } from '@/components/PageHead';

export const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });
  const router = useRouter();
  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [waitForLogin, setWaitForLogin] = useState(false);

  const onSubmit = async (reqData: any) => {
    setWaitForLogin(true);
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
      errorToast(res.error, [], context);
    }
    setWaitForLogin(false);
  };

  if (session?.user?.token) {
    router.push('/');
  }

  return (
    <>
      <PageHead title="Dalgo | Login" />

      <Auth heading="Log In" subHeading="Please enter correct login details below">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
          <Box className={styles.Container}>
            <Input
              error={!!errors.username}
              sx={{ width: '100%', pb: 2 }}
              id="outlined-basic"
              data-testid="username"
              label="Business email"
              placeholder="eg. user@domain.com"
              variant="outlined"
              required
              register={register}
              name="username"
              helperText={errors.username?.message}
            />
            <Input
              error={!!errors.password}
              required
              helperText={errors.password?.message}
              sx={{ width: '100%' }}
              id="outlined-password-input"
              data-testid="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              register={register}
              name="password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box>
                      <IconButton
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ textAlign: 'right', pb: 4 }}>
              <Link
                href="/forgotpassword"
                sx={{
                  textDecoration: 'none',
                  color: '#c0c2c3',
                  fontWeight: '600',
                }}
              >
                Forgot password?
              </Link>
            </Box>
            {errors.root?.message && (
              <FormHelperText sx={{ color: 'red', mb: 1, textAlign: 'center' }}>
                {errors.root?.message}
              </FormHelperText>
            )}

            <Button
              variant="contained"
              sx={{ width: '100%', mb: 2, minHeight: '50px' }}
              type="submit"
              disabled={waitForLogin}
              data-testid="submitbutton"
            >
              Login {waitForLogin && <CircularProgress sx={{ ml: 2 }} size="1rem" />}
            </Button>
            <Divider>OR</Divider>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              Not a member?{' '}
              <Link href="/signup" sx={{ textDecoration: 'none' }}>
                Sign Up
              </Link>
            </Box>
          </Box>
        </form>
      </Auth>
    </>
  );
};

export default Login;
