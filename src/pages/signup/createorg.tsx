import { Box, Button, Grid, Paper, TextField } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import styles from '@/styles/Login.module.css';

export const CreateOrg = () => {
  const { data: session, update }: any = useSession();
  const router = useRouter();
  const [saveError, setSaveError] = useState(null);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    setSaveError(null);

    fetch(`${backendUrl}/api/organizations/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        name: data.name,
      }),
    })
      .then((response) => {
        if (response.ok) {
          response.json().then((res) => {
            (async () => {
              update({ org: res.name });
            })();

            router.push('/');
          });
        } else {
          response.json().then((errorMessage) => {
            setSaveError(errorMessage.error);
          });
        }
      })
      .catch((error) => {
        setSaveError(error);
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
                    data-testid="input-orgname"
                    label="Organization name"
                    variant="outlined"
                    {...register('name', { required: true })}
                  />
                </Box>
                <Box className={styles.Input}>
                  <Button variant="contained" type="submit">
                    Save
                  </Button>
                </Box>
              </form>
              <div>{saveError}</div>
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateOrg;
