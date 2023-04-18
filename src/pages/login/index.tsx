import { Box, Button, TextField } from '@mui/material';
import { signIn } from 'next-auth/react';
import { redirect } from 'next/dist/server/api-utils';
import { useForm } from 'react-hook-form';

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
    <Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box>
          <TextField
            id="outlined-basic"
            label="Business email*"
            variant="outlined"
            {...register('username', { required: true })}
          />
        </Box>
        <Box>
          <TextField
            id="outlined-password-input"
            label="Password*"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: true })}
          />
        </Box>
        <Box>
          <Button variant="contained" type="submit">
            Login
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default Login;
