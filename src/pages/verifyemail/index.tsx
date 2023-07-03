import { Box, Button } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import styles from '@/styles/Login.module.css';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSearchParams } from 'next/navigation';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import Input from '@/components/UI/Input/Input';
import Auth from '@/components/Layouts/Auth';
import { httpPost } from '../../helpers/http';

export const VerifyEmail = () => {
  const { handleSubmit } = useForm();
  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = async () => {
    try {
      await httpPost(session, 'users/verify_email/', {
        token: token,
      });
      router.push('/');
    } catch (error: any) {
      errorToast(error.cause.detail, [], toastContext);
    }
  };

  return (
    <Auth
      heading="Almost done..."
      subHeading="Click to verify your email address"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        data-testid="email-verification-form"
      >
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
  );
};

export default VerifyEmail;
