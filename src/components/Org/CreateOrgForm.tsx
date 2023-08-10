import { Box, Button, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import Input from '@/components/UI/Input/Input';
import CustomDialog from '../Dialog/CustomDialog';

interface CreateOrgFormProps {
  closeSideMenu: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

export const CreateOrgForm = ({
  closeSideMenu,
  showForm,
  setShowForm,
}: CreateOrgFormProps) => {
  const { data: session, update }: any = useSession();
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const toastContext = useContext(GlobalContext);

  const handleClose = () => {
    reset();
    setShowForm(false);
    closeSideMenu();
  };

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

  const formContent = (
    <>
      <Box>
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
    </>
  );

  return (
    <>
      <CustomDialog
        title={'Add a new organization'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={formContent}
        formActions={
          <Box>
            <Button variant="contained" type="submit" data-testid="savebutton">
              Save
            </Button>
            <Button
              color="secondary"
              variant="outlined"
              onClick={handleClose}
              data-testid="cancelbutton"
              sx={{ marginLeft: '5px' }}
            >
              Cancel
            </Button>
          </Box>
        }
        loading={waitForOrgCreation}
      />
    </>
  );
};

export default CreateOrgForm;
