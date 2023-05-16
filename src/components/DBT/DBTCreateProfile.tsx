import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import {
  errorToast,
  successToast,
} from '@/components/ToastMessage/ToastHelper';

export const DBTCreateProfile = (props: any) => {

  const { register, handleSubmit } = useForm({ defaultValues: { name: '', target_configs_schema: '' } });
  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);

  type Profile = {
    name: string;
    target_configs_schema: string;
  };

  const createDbtProfile = async function (profile: Profile) {

    console.log(profile);

    const response = await fetch(`${backendUrl}/api/prefect/blocks/dbt/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.user.token}`,
      },
      body: JSON.stringify({
        profile
      })
    });

    if (response.ok) {
      const message = await response.json();
      if (message.success) {
        successToast("Success", [], context);
        props.createdProfile(message.block_names);
      }

    } else {
      if (response.body) {
        const error = await response.json();
        errorToast(JSON.stringify(error), [], context);
      }
    }

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
          <Button variant="contained" type="submit" data-testid="save-profile">
            Save
          </Button>
        </Box>
      </form>
    </>
  );
}
