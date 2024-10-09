import { Box, Button, Link } from '@mui/material';
import { signOut, useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import LogoutIcon from '@/assets/icons/logout.svg';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import { httpGet } from '../../helpers/http';
import Image from 'next/image';
import { PageHead } from '@/components/PageHead';

export const VerifyEmailResend = () => {
  const { handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const handleSignout = () => {
    // Hit backend api to invalidate the token
    localStorage.clear();
    signOut({ callbackUrl: '/login' });
  };

  const onSubmit = async () => {
    try {
      await httpGet(session, 'users/verify_email/resend');
      successToast('Verification email sent to your inbox', [], globalContext);
    } catch (error: any) {
      console.log(error);
      errorToast(error.cause.detail, [], globalContext);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | Resend Email" />

      <Auth heading="Check your Inbox for the verification email" subHeading="">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="resend-email-form">
          <Box className={styles.Container}>
            <Button
              variant="contained"
              sx={{ width: '100%', mb: 3, minHeight: '50px' }}
              type="submit"
              data-testid="submit"
            >
              Resend verification email
            </Button>
          </Box>
        </form>
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
      </Auth>
    </>
  );
};

export default VerifyEmailResend;
