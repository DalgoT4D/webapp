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
import { getSession, signIn, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

import styles from '@/styles/Login.module.css';
import { useRouter } from 'next/router';
import { useContext, useState, useEffect } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import Input from '@/components/UI/Input/Input';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { PageHead } from '@/components/PageHead';
import { useEmbeddedAuth } from '@/hooks/useEmbeddedAuth';
// import { getEmbeddedAuth, isEmbedded } from '@/middleware/embeddedAuth';

export const Login = () => {
  const {
    register,
    handleSubmit,
    setValue,
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
  const [autoSigningIn, setAutoSigningIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isIframed, embedToken } = useEmbeddedAuth();

  // Ensure component is mounted before checking embed token
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-signin with embedded token if available (only after mounting)
  useEffect(() => {
    const autoSignInWithToken = async () => {
      if (mounted && embedToken && !session?.user?.token && !autoSigningIn) {
        setAutoSigningIn(true);
        try {
          // Use NextAuth signIn with the embed-token provider
          const res = await signIn('embed-token', {
            token: embedToken,
            redirect: false, // Prevent automatic redirect
          });

          console.log('Auto sign-in response:', res);

          if (res?.ok) {
            // Refresh session to ensure it's properly set
            await getSession();

            const redirectUrl =
              '/pipeline/ingest?tab=connections&embedHideHeader=true&embedApp=true';
            router.push(redirectUrl);
            return;
          }

          // If auto sign-in fails, continue to show login form
          console.log('Auto sign-in with embed token failed');
        } catch (error) {
          console.error('Auto sign-in error:', error);
        } finally {
          setAutoSigningIn(false);
        }
      }
    };

    autoSignInWithToken();
  }, [mounted, embedToken]); // Removed session dependency to prevent loop

  // Capture embedded state from URL, referrer, or iframe detection on mount
  // useEffect(() => {
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const embedded = urlParams.get('embedded');
  //   const hide = urlParams.get('hide');

  //   // Check if we have embedded params in URL
  //   if (embedded === 'true') {
  //     sessionStorage.setItem('isEmbedded', 'true');
  //     if (hide) {
  //       sessionStorage.setItem('embeddedHide', hide);
  //     }
  //     console.log('Login page: Stored embedded state from URL', { embedded, hide });
  //   } else {
  //     // Check if we're in an iframe
  //     const isInIframe = window !== window.parent;
  //     if (isInIframe) {
  //       sessionStorage.setItem('isEmbedded', 'true');
  //       sessionStorage.setItem('embeddedHide', 'true'); // Default to hiding sidebar in iframe
  //       console.log('Login page: Detected iframe, setting embedded state');
  //     } else {
  //       // Check if we came from an embedded page (referrer contains embedded=true)
  //       const referrer = document.referrer;
  //       if (referrer && referrer.includes('embedded=true')) {
  //         sessionStorage.setItem('isEmbedded', 'true');
  //         if (referrer.includes('hide=true')) {
  //           sessionStorage.setItem('embeddedHide', 'true');
  //         }
  //         console.log('Login page: Detected embedded state from referrer', referrer);
  //       }
  //     }
  //   }
  // }, []);

  const onSubmit = async (reqData: any) => {
    setWaitForLogin(true);
    const res: any = await signIn('credentials', {
      username: reqData.username,
      password: reqData.password,
      redirect: false,
      callbackUrl: '/',
    });
    if (res.ok) {
      // Check if we're in embedded mode and redirect accordingly
      // const { isIframed } = useEmbeddedAuth();

      if (isIframed) {
        // In embedded mode, redirect to ingest page with hide parameter if it was set
        const redirectUrl = isIframed
          ? '/pipeline/ingest?tab=connections&embedHideHeader=true&embedApp=true'
          : '/pipeline/ingest?tab=connections';
        router.push(redirectUrl);
      } else {
        // Normal mode, redirect to pipeline overview
        router.push('/pipeline');
      }
      successToast('User logged in successfully', [], context);
    } else {
      errorToast(res.error, [], context);
    }
    setWaitForLogin(false);
  };

  // Simple redirect if already logged in
  if (session?.user?.token) {
    // Check if we're in iframe mode
    if (isIframed) {
      // In embedded mode, redirect to ingest page with hide parameter if it was set
      const redirectUrl = isIframed
        ? '/pipeline/ingest?tab=connections&embedHideHeader=true&embedApp=true'
        : '/pipeline/ingest?tab=connections';
      router.push(redirectUrl);
    } else {
      // Normal mode, redirect to home
      router.push('/');
    }
  }

  // Show loading state when auto-signing in with embed token (only after mounting)
  if (mounted && (autoSigningIn || (embedToken && !session?.user?.token))) {
    return (
      <>
        <PageHead title="Dalgo | Signing In" />
        <Auth heading="Signing you in..." subHeading="">
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Auth>
      </>
    );
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
              onBlur={(e) => setValue('username', e.target.value.trim())}
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
