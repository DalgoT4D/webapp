import { Box, Button, Grid, Paper, TextField, Link } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
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
  var signupError;
  const { register, handleSubmit } = useForm();
  const onSubmit = async (data: any) => {
    console.log("register using " + data.username + " and " + data.password);
    signupError = null;
    fetch(`${backendUrl}/api/organizations/users/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        email: data.username,
        password: data.password,
      }),
    }).then((response) => {
      console.log(response);
      if (response.ok) {
        console.log("success");
        response.json().then((message) => {
          console.log("email=" + message.email);
          console.log("active=" + message.active);
          console.log("role=" + message.role);
          console.log("org=" + message.org);
          signIn('credentials', {
            username: data.username,
            password: data.password,
            redirect: true,
            callbackUrl: '/',
          });
        })
      } else {
        console.error("caught application error");
        response.json().then((errorMessage) => {
          signupError = errorMessage.error;
          console.log("set signupError = ");
          console.log(signupError);
        })
      }
    }).catch((error) => {
      console.error("caught network error ");
      console.error(error);
      signupError = error;
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
                    <Button variant="contained" type="button">
                      Login
                    </Button>
                  </Link>
                </Box>
              </form>
              <div>signupError: {signupError}</div>
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
