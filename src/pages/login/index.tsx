import { Box, Button, Grid, TextField } from '@mui/material';
import { signIn } from 'next-auth/react';
import { redirect } from 'next/dist/server/api-utils';
import { useForm } from 'react-hook-form';

import styles from '@/styles/Login.module.css';

export const Login = () => {
  const { register, handleSubmit } = useForm();
  const onSubmit = async (data: any) => {
    const result = await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirect: true,
      callbackUrl: '/',
    });
  };

  return (
    <Box className={styles.Container}>
      <Grid container spacing={2} columns={16}>
        <Grid item xs={8}>
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
            </Box>
          </form>
        </Grid>
        <Grid item xs={8}>
          Banner Image
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
