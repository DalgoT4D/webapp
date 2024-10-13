import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import Input from '@/components/UI/Input/Input';
import CustomDialog from '../Dialog/CustomDialog';

interface CreateOrgFormProps {
  closeSideMenu: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

export const CreateOrgForm = ({ closeSideMenu, showForm, setShowForm }: CreateOrgFormProps) => {
  const { data: session }: any = useSession();
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);
  const [newlyCreatedOrg, setNewlyCreatedOrg] = useState<string>('');
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const globalContext = useContext(GlobalContext);

  const handleClose = () => {
    reset();
    setShowForm(false);
    closeSideMenu();
  };

  const onSubmit = async (data: any) => {
    setWaitForOrgCreation(true);
    try {
      const res = await httpPost(session, 'v1/organizations/', {
        name: data.name,
      });
      // directly updating locatStorage here doesn't, dont know why
      if (res?.slug) {
        setNewlyCreatedOrg(res.slug);
      }
      handleClose();
      successToast('Success', [], globalContext);
      setWaitForOrgCreation(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setWaitForOrgCreation(false);
  };

  useEffect(() => {
    if (newlyCreatedOrg) localStorage.setItem('org-slug', newlyCreatedOrg);
  }, [newlyCreatedOrg]);

  const formContent = (
    <>
      <Box sx={{ mt: 2 }}>
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
