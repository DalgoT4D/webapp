import {
  Box,
  Button,
  CircularProgress,
  FormHelperText,
  IconButton,
  InputAdornment,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import Input from '@/components/UI/Input/Input';
import { httpPost } from '../../helpers/http';
import { PageHead } from '@/components/PageHead';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import SuccessIcon from '@/assets/icons/success.svg';
import Image from 'next/image';
const ChangePassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const { data: session }: any = useSession();
  const toastContext = useContext(GlobalContext);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [waitForLogin, setWaitForLogin] = useState(false);

  const router = useRouter();

  const onSubmit = async (reqData: any) => {
    if (reqData.password !== reqData.confirmPassword) {
      errorToast('Password and Confirm password must be same', [], toastContext);
      return;
    }
    setWaitForLogin(true);
    try {
      const response = await httpPost(session, 'users/change_password/', {
        password: reqData.password,
        confirmPassword: reqData.confirmPassword,
      });
      if (!response.success) {
        errorToast('Something went wrong', [], toastContext);
        return;
      } else {
        setShowSuccess(true);
      }
    } catch (error: any) {
      errorToast(error.cause.detail, [], toastContext);
    } finally {
      setWaitForLogin(false);
    }
  };

  return (
    <>
      <PageHead title="Dalgo | Change Password" />
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            boxShadow: '0px 6px 11px 0px rgba(64, 68, 77, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 1)',
            borderRadius: '12px',
            height: '480px',
            width: '480px',
            padding: '40px',
          }}
        >
          {showSuccess ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: '31px' }}>
                <Image src={SuccessIcon} alt="check icon" />{' '}
              </Box>
              <Box sx={{ marginBottom: '37px' }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '32px',
                    color: 'rgba(15, 36, 64, 1)',
                    marginBottom: '12px',
                  }}
                >
                  Success
                </Typography>
                <Typography
                  sx={{ fontWeight: 600, fontSize: '14px', color: 'rgba(117, 131, 151, 1)' }}
                >
                  Your have successfully changed password for your account and can now use your new
                  password to login!
                </Typography>
              </Box>
              <Button
                variant="contained"
                sx={{ width: '100%', mb: 2, minHeight: '50px', fontSize: '18px' }}
                type="submit"
                data-testid="submitbutton"
                onClick={() => {
                  router.push('/pipeline');
                }}
              >
                Finish
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ textAlign: 'center', marginBottom: '37px' }}>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '32px',
                    color: 'rgba(15, 36, 64, 1)',
                    marginBottom: '12px',
                  }}
                >
                  Change your password
                </Typography>
                <Typography
                  sx={{ fontWeight: 600, fontSize: '14px', color: 'rgba(117, 131, 151, 1)' }}
                >
                  Please enter a new password below to change your password
                </Typography>
              </Box>
              <form onSubmit={handleSubmit(onSubmit)} data-testid="login-form">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <Input
                    error={!!errors.password}
                    required
                    helperText={errors.password?.message}
                    sx={{ width: '100%' }}
                    id="outlined-password-input"
                    data-testid="password"
                    label="Create new password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create new password"
                    register={register}
                    name="password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box>
                            <IconButton
                              onClick={() => {
                                setShowPassword(!showPassword);
                              }}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOutlinedIcon />
                              ) : (
                                <VisibilityOffOutlinedIcon />
                              )}
                            </IconButton>
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Input
                    error={!!errors.password}
                    required
                    helperText={errors.password?.message}
                    sx={{ width: '100%' }}
                    id="outlined-confirmpassword-input"
                    data-testid="confirm-password"
                    label="Confirm new password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new passowrd"
                    register={register}
                    name="confirmPassword"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Box>
                            <IconButton
                              onClick={() => {
                                setShowConfirmPassword(!showConfirmPassword);
                              }}
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOutlinedIcon />
                              ) : (
                                <VisibilityOffOutlinedIcon />
                              )}
                            </IconButton>
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                  />

                  {errors.root?.message && (
                    <FormHelperText sx={{ color: 'red', mb: 1, textAlign: 'center' }}>
                      {errors.root?.message}
                    </FormHelperText>
                  )}

                  <Button
                    variant="contained"
                    sx={{ width: '100%', mb: 2, minHeight: '50px' }}
                    type="submit"
                    disabled={waitForLogin}
                    data-testid="submitbutton"
                  >
                    Continue {waitForLogin && <CircularProgress sx={{ ml: 2 }} size="1rem" />}
                  </Button>
                </Box>
              </form>
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default ChangePassword;
