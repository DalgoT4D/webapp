import { Box, Button, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import Auth from '@/components/Layouts/Auth';
import Input from '@/components/UI/Input/Input';

export const CreateOrg = () => {
  const { data: session, update }: any = useSession();
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const toastContext = useContext(GlobalContext);

  const onSubmit = async (data: any) => {
    setWaitForOrgCreation(true);
    try {
      const message = await httpPost(session, 'organizations/', {
        name: data.name,
      });
      update({ org: message.name });
      successToast('Success', [], toastContext);
      router.push('/');
    } catch (err: any) {
      console.error(err);
      setError('name', { type: 'custom', message: err.message });
    }
    setWaitForOrgCreation(false);
  };

  return (
    <Auth heading="Enter organization details">
      <form onSubmit={handleSubmit(onSubmit)} data-testid="createorg-form">
        <Box className={styles.Input}>
          <Input
            error={!!errors.name}
            helperText={errors.name?.message}
            sx={{ mb: 4, width: '100%' }}
            id="outlined-basic"
            data-testid="input-orgname"
            label="Organization name"
            variant="outlined"
            register={register}
            name="name"
            required
          />
        </Box>
        <Box className={styles.Input}>
          <Button
            variant="contained"
            type="submit"
            disabled={waitForOrgCreation}
            sx={{ width: '100%', minHeight: '50px' }}
          >
            Save{' '}
            {waitForOrgCreation && (
              <CircularProgress sx={{ ml: 2 }} size="1rem" />
            )}
          </Button>
        </Box>
      </form>
    </Auth>
  );
};

export default CreateOrg;
