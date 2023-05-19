import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

export const DBTCreateProfile = (props: any) => {

  const { register, handleSubmit } = useForm({ defaultValues: { name: '', target_configs_schema: '' } });
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [running, setRunning] = useState(false);

  type Profile = {
    name: string;
    target_configs_schema: string;
  };

  const createDbtProfile = async function (profile: Profile) {

    setRunning(true);

    try {
      const message = await httpPost(session, `prefect/blocks/dbt/`, {
        profile
      });
      if (message.success) {
        successToast("Success", [], toastContext);
        props.createdProfile(message.block_names);
      }
    }
    catch (err: any) {
      console.error(err);
      errorToast(err.message, [], toastContext);
    }

    setRunning(false);
  };

  return (
    <>
      <h3>Add a dbt profile</h3>
      <i>From your dbt_project.yml</i>
      <form onSubmit={handleSubmit(createDbtProfile)}>
        <Box className={styles.Input} >
          <TextField
            data-testid="target-schema"
            label="Profile name from dbt_project.yml"
            variant="outlined"
            {...register('name', { required: true })}
          />
        </Box>
        <Box className={styles.Input} >
          <TextField
            data-testid="target-schema"
            label="Target schema in warehouse"
            variant="outlined"
            {...register('target_configs_schema')}
          />
        </Box>
        <Box className={styles.Input}>
          {
            running &&
            <div>Please wait...</div>
          }
          {
            !running &&
            <Button variant="contained" type="submit" data-testid="save-profile">
              Save
            </Button>
          }
        </Box>
      </form>
    </>
  );
}
