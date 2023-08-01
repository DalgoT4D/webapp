import React, { useContext, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import { Box, Button } from '@mui/material';
import Input from '../UI/Input/Input';
import { useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';
import { roles } from '@/config/constant';

interface InviteUserFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
}

type InviteUserFormInput = {
  invited_email: string;
};

const InviteUserForm = ({
  mutate,
  showForm,
  setShowForm,
}: InviteUserFormProps) => {
  const { data: session }: any = useSession();
  const [loading, setLoading] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);

  const {
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<InviteUserFormInput>({
    defaultValues: {
      invited_email: '',
    },
  });

  const handleClose = () => {
    reset();
    setShowForm(false);
  };
  const formContent = (
    <>
      <Box sx={{ pt: 2, pb: 4 }}>
        <Input
          error={!!errors.invited_email}
          helperText={errors.invited_email?.message}
          sx={{ width: '100%' }}
          label="Email"
          variant="outlined"
          required
          register={register}
          name="invited_email"
        ></Input>
        <Box sx={{ m: 2 }} />
      </Box>
    </>
  );

  const onSubmit = async (data: any) => {
    setLoading(true);
    console.log('submitting form with data', data);
    try {
      await httpPost(session, 'organizations/users/invite/', {
        invited_email: data.invited_email,
        invited_role: roles.find((role) => role.slug === 'pipeline_manager')
          ?.id,
      });
      mutate();
      handleClose();
      successToast('Invitation sent over email', [], globalContext);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
  };

  return (
    <>
      <CustomDialog
        title={'Invite User'}
        show={showForm}
        handleClose={handleClose}
        handleSubmit={handleSubmit(onSubmit)}
        formContent={formContent}
        formActions={
          <Box>
            <Button variant="contained" type="submit" data-testid="savebutton">
              Send invitation
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
        loading={false}
      />
    </>
  );
};

export default InviteUserForm;
