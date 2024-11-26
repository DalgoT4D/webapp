import {
  Box,
  Button,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Auth from '@/components/Layouts/Auth';
import { signIn } from 'next-auth/react';
import styles from '@/styles/Login.module.css';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import Input from '@/components/UI/Input/Input';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { PageHead } from '@/components/PageHead';

export const SignUp = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  if (session?.user.token) {
    router.push('/');
  }
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: '',
      password: '',
      confirmpassword: '',
      signupcode: '',
    },
  });
  const password = watch('password');
  const toastContext = useContext(GlobalContext);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [waitForSignup, setWaitForSignup] = useState(false);

  const onSubmit = async (data: any) => {
    try {
      setWaitForSignup(true);
      await httpPost(session, 'organizations/users/', {
        email: data.username,
        password: data.password,
        signupcode: data.signupcode,
      });
      signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: true,
        callbackUrl: '/',
      });
    } catch (err: any) {
      console.error(err);
      errorToast(err.cause.detail, [], toastContext);
    }
    setWaitForSignup(false);
  };

  return (
    <>
      <PageHead title="Dalgo | Signup" />

      <Auth
        heading="Create an account"
        subHeading="Please enter correct registration details below"
      >
        <form onSubmit={handleSubmit(onSubmit)} data-testid="signup-form">
          <Box className={styles.Container}>
            <Input
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{ width: '100%', pb: 3, mt: 2 }}
              id="outlined-basic"
              data-testid="username"
              label="Business email"
              variant="outlined"
              placeholder="eg. user@domain.com"
              register={register}
              name="username"
              onBlur={(e) => setValue('username', e.target.value.trim())}
              required
            />

            <Input
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ width: '100%', pb: 3 }}
              id="outlined-password-input"
              data-testid="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              register={register}
              required
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

            <Input
              error={!!errors.confirmpassword}
              helperText={errors.confirmpassword?.message}
              hookFormValidations={{
                validate: (value: string) => value === password || 'Passwords do not match',
              }}
              sx={{ width: '100%', pb: 3 }}
              id="outlined-confirm-password-input"
              data-testid="confirmpassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              register={register}
              required
              name="confirmpassword"
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

            <Input
              error={!!errors.signupcode}
              helperText={errors.signupcode?.message}
              sx={{ width: '100%', pb: 3 }}
              id="outlined-basic"
              label="Signup code"
              data-testid="signupcode"
              variant="outlined"
              register={register}
              placeholder="Enter code"
              name="signupcode"
              onBlur={(e) => setValue('signupcode', e.target.value.trim())}
              required
            />
            <Button
              sx={{ width: '100%', mb: 3, minHeight: '50px' }}
              variant="contained"
              type="submit"
              disabled={waitForSignup}
              data-testid="submitbutton"
            >
              Sign Up {waitForSignup && <CircularProgress sx={{ ml: 2 }} size="1rem" />}
            </Button>
            <Divider>OR</Divider>
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              Already a member?{' '}
              <Link href="/login" sx={{ textDecoration: 'none' }}>
                Log in
              </Link>
            </Box>
            <Box sx={{ mt: 1, textAlign: 'center' }}>
              Need a signup code?{' '}
              <Link
                href="https://dalgo.in/contact-us/"
                target="_blank"
                sx={{ textDecoration: 'none' }}
              >
                Contact Us
              </Link>
            </Box>
          </Box>
        </form>
      </Auth>
    </>
  );
};

export default SignUp;
