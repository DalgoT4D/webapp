import { Box, Button, TextField } from '@mui/material';
import styles from '@/styles/Home.module.css';
import { useForm } from 'react-hook-form';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export const DBTCreateProfile = () => {

  const { register, handleSubmit } = useForm({ defaultValues: { name: '', schema: '' } });
  const { data: session }: any = useSession();
  const [failureMessage, setFailureMessage] = useState<string>('');

  type Profile = {
    name: string;
    target: string;
    target_configs_schema: string;
  };

  const createProfile = async function (profile: Profile) {

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
      console.log(message);
    } else {
      if (response.body) {
        const error = await response.json();
        setFailureMessage(JSON.stringify(error));
      }
    }

  };

  const onSubmit = async (data: any) => {
    console.log(data);
    await createProfile({
      name: data.schema, target: 'dev', target_configs_schema: data.schema
    } as Profile);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box className={styles.Input} >
          <TextField
            data-testid="target-schema"
            label="Profile name"
            variant="outlined"
            {...register('name', { required: true })}
          />
        </Box>
        <Box className={styles.Input} >
          <TextField
            data-testid="target-schema"
            label="Target schema"
            variant="outlined"
            {...register('schema')}
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
