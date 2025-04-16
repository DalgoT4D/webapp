import React, { useContext, useState } from 'react';
import CustomDialog from '../Dialog/CustomDialog';
import useSWR from 'swr';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  MenuItem,
  Select,
} from '@mui/material';
import Input from '../UI/Input/Input';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { httpPost } from '@/helpers/http';

interface InviteUserFormProps {
  mutate: (...args: any) => any;
  showForm: boolean;
  setShowForm: (...args: any) => any;
  setMutateInvitationsParent: (...args: any) => any; // ✅ ADD THIS PROP
}

type InviteUserFormInput = {
  invited_email: string;
  invited_role_uuid: string;
};

const InviteUserForm = ({
  mutate,
  showForm,
  setShowForm,
  setMutateInvitationsParent, // ✅ ADD HERE TOO
}: InviteUserFormProps) => {
  const { data: session }: any = useSession();
  const { data: roles } = useSWR(`data/roles`);
  const [loading, setLoading] = useState<boolean>(false);
  const globalContext = useContext(GlobalContext);
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteUserFormInput>({
    defaultValues: {
      invited_email: '',
      invited_role_uuid: '',
    },
  });

  const handleClose = () => {
    reset();
    setShowForm(false);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await httpPost(session, 'v1/organizations/users/invite/', {
        invited_email: data.invited_email,
        invited_role_uuid: data.invited_role_uuid,
      });

      mutate(); // ✅ refresh users list
      setMutateInvitationsParent(true); // ✅ refresh pending invitations list

      handleClose();
      successToast('Invitation sent over email', [], globalContext);
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }
    setLoading(false);
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
        />
        {roles && (
          <Controller
            control={control}
            rules={{ required: 'Role is required' }}
            name="invited_role_uuid"
            render={({ field, fieldState }) => (
              <FormControl sx={{ width: '100%', mt: 2 }}>
                <FormLabel>Role*</FormLabel>
                <Select
                  data-testid="role"
                  error={!!fieldState.error}
                  sx={{ height: '56px' }}
                  label="role"
                  value={field.value}
                  placeholder="Select role"
                  onChange={(event) => field.onChange(event.target.value)}
                >
                  {roles.map((role: any) => (
                    <MenuItem key={role.uuid} value={role.uuid}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldState.error && (
                  <FormHelperText sx={{ color: 'red' }}>{fieldState.error.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />
        )}
        <Box sx={{ m: 2 }} />
      </Box>
    </>
  );

  return (
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
      loading={loading}
    />
  );
};

export default InviteUserForm;
