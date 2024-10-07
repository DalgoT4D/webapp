import { Box, Button, CircularProgress, Divider, Link } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import LogoutIcon from '@/assets/icons/logout.svg';

import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import Input from '@/components/UI/Input/Input';
import { httpPost } from '@/helpers/http';
import Image from 'next/image';
import { PageHead } from '@/components/PageHead';

export const CreateOrgPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
    },
  });
  const router = useRouter();
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);
  const [waitForOrgCreation, setWaitForOrgCreation] = useState(false);

  const handleSignout = () => {
    // Hit backend api to invalidate the token
    localStorage.clear();
    signOut({ callbackUrl: '/login' });
  };

  const onSubmit = async (data: any) => {
    setWaitForOrgCreation(true);
    try {
      await httpPost(session, 'v1/organizations/', {
        name: data.name,
      });
      successToast('Success', [], globalContext);
      router.push('/pipeline');
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setWaitForOrgCreation(false);
  };

  return (
    <>
      <PageHead title="Dalgo | Create org" />
      <Auth heading="Add a new organization">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
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

          <Button
            variant="contained"
            sx={{ width: '100%', mb: 2, minHeight: '50px' }}
            type="submit"
            disabled={waitForOrgCreation}
            data-testid="submitbutton"
          >
            Save {waitForOrgCreation && <CircularProgress sx={{ ml: 2 }} size="1rem" />}
          </Button>
          <Divider></Divider>
          <Box
            sx={{
              mt: 3,
              fontSize: '18px',
              alignItems: 'center',
              justifyContent: 'center',
              ':hover': { cursor: 'pointer' },
              display: 'flex',
            }}
            onClick={() => handleSignout()}
          >
            <Image src={LogoutIcon} alt="logout icon" />
            <Link sx={{ textDecoration: 'underline' }}>Logout</Link>
          </Box>
        </form>
      </Auth>
    </>
  );
};

export default CreateOrgPage;
