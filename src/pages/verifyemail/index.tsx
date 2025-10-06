import { Box, Button } from '@mui/material';
import { useSession, signOut } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSearchParams } from 'next/navigation';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import Auth from '@/components/Layouts/Auth';
import { httpPost } from '../../helpers/http';
import { PageHead } from '@/components/PageHead';
import { useSignOut } from '@/hooks/useSignOut';

export const VerifyEmail = () => {
  const { handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { handleSignOut } = useSignOut();

  const onSubmit = async () => {
    try {
      await httpPost(session, 'users/verify_email/', {
        token: token,
      });
      handleSignOut();
    } catch (error: any) {
      errorToast(error.cause.detail, [], toastContext);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | Verify Email" />

      <Auth heading="Almost done..." subHeading="Click to verify your email address">
        <form onSubmit={handleSubmit(onSubmit)} data-testid="email-verification-form">
          <Box className={styles.Container}>
            <Button
              variant="contained"
              sx={{ width: '100%', mb: 3, minHeight: '50px' }}
              type="submit"
              data-testid="submit"
            >
              Verify
            </Button>
          </Box>
        </form>
      </Auth>
    </>
  );
};

export default VerifyEmail;
