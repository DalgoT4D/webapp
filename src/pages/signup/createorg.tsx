import { Box, Button, Grid, Paper, TextField } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

export const CreateOrg = () => {
  const { data: session, update }: any = useSession();
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const toastContext = useContext(GlobalContext);

  const onSubmit = async (data: any) => {
    try {
      const message = await httpPost(session, 'organizations/', {
        name: data.name,
      });
      update({ org: message.name });
      successToast("Success", [], toastContext);
      router.push('/');
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
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreateOrg;
