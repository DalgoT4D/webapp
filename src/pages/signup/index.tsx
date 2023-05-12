import { Box, Button, Grid, Paper, TextField, Link } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Banner from '@/images/banner.png';
import { backendUrl } from '@/config/constant';
import { signIn } from 'next-auth/react';
import styles from '@/styles/Login.module.css';

export const SignUp = () => {
  const { data: session }: any = useSession();
  const router = useRouter();
  if (session?.user.token) {
    router.push('/');
  }
  const [signupError, setSignupError] = useState(null);
  const { register, handleSubmit } = useForm();
  const onSubmit = async (data: any) => {
    setSignupError(null);
    fetch(`${backendUrl}/api/organizations/users/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        email: data.username,
        password: data.password,
      }),
    })
      .then((response) => {
        if (response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          response.json().then((message) => {
            signIn('credentials', {
              username: data.username,
              password: data.password,
              redirect: true,
              callbackUrl: '/signup/createorg',
            });
          });
        } else {
          response.json().then((errorMessage) => {
            setSignupError(errorMessage.error);
          });
        }
      })
      .catch((error) => {
        setSignupError(error);
      });
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
              <div>{signupError}</div>
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
