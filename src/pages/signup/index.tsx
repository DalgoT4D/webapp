import { Box, Button, Grid, Paper, TextField, Link } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Banner from '@/images/banner.png';
import { signIn } from 'next-auth/react';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';


export const SignUp = () => {
  const { data: session, update }: any = useSession();
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
      });
      signIn('credentials', {
        username: data.username,
        password: data.password,
        redirect: true,
        callbackUrl: '/signup/createorg',
      });
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    };
  };

  return (
    <Box className={styles.Container}>
      <Grid container columns={16}>
        <Grid item xs={8}>
          <Grid
            container
            height="100vh"
            direction="row"
            justifyContent="center"
            alignItems="center"
          >
            <Paper elevation={3} sx={{ p: 4 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Box className={styles.Input}>
                  <TextField
                    id="outlined-basic"
                    label="Business email"
                    variant="outlined"
                    {...register('username', { required: true })}
                  />
                </Box>
                <Box className={styles.Input}>
                  <TextField
                    id="outlined-password-input"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password', { required: true })}
                  />
                </Box>
                <Box className={styles.Input}>
                  <Button variant="contained" type="submit">
                    Sign Up
                  </Button>
                  <Link href="/login">
                    Login
                  </Link>
                </Box>
              </form>
            </Paper>
          </Grid>
        </Grid>

        <Grid item xs={8}>
          <Image src={Banner} alt="Banner" style={{ width: '100%' }} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SignUp;
