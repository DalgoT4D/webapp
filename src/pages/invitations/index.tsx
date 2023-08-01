import styles from '@/styles/Login.module.css';
import Auth from '@/components/Layouts/Auth';
import React, { useContext, useEffect, useState } from 'react';
import Input from '@/components/UI/Input/Input';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

const AcceptInvite = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  if (session?.user.token) {
    router.push('/');
  }

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmpassword: '',
    },
  });
  const password = watch('password');
  const globalContext = useContext(GlobalContext);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (router.query?.invite_code) {
      setInvitationCode(String(router.query?.invite_code));
    }
  }, [router.query]);

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      await httpPost(session, 'organizations/users/invite/accept/', {
        password: data.password,
        invite_code: invitationCode,
      });
      router.push('/login');
      successToast('Invitation successfully accepted', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.cause.detail, [], globalContext);
    }
    setLoading(false);
  };

  return (
    <Auth heading="Welcome aboard" subHeading="User invitation">
      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid="accept-invitation-form"
      >
        <Box className={styles.Container}>
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
                      {showPassword ? (
                        <VisibilityOutlinedIcon />
                      ) : (
                        <VisibilityOffOutlinedIcon />
                      )}
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
              validate: (value: string) =>
                value === password || 'Passwords do not match',
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
                      {showPassword ? (
                        <VisibilityOutlinedIcon />
                      ) : (
                        <VisibilityOffOutlinedIcon />
                      )}
                    </IconButton>
                  </Box>
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            sx={{ width: '100%', mb: 3, minHeight: '50px' }}
            type="submit"
            data-testid="submit"
          >
            Confirm {loading && <CircularProgress sx={{ ml: 2 }} size="1rem" />}
          </Button>
        </Box>
      </form>
    </Auth>
  );
};

export default AcceptInvite;
