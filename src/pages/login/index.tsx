import { Box, Button, Grid, Paper, TextField, Link } from '@mui/material';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import Banner from '@/images/banner.png';

import styles from '@/styles/Login.module.css';
import { useRouter } from 'next/router';

export const Login = () => {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { data: session }: any = useSession();

  const onSubmit = async (reqData: any) => {
    const res: any = await signIn('credentials', {
      username: reqData.username,
      password: reqData.password,
      redirect: false,
      callbackUrl: '/',
    });
    if (res.ok) {
      router.push('/');
    } else {
      // show toast error
    }
  };

  return (
    !session?.user?.token && (
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
                      Login
                    </Button>
                    <Link href="/signup">Sign Up</Link>
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
    )
  );
};

export default Login;
