import { Box, Button, Paper, Typography } from '@mui/material';
import styles from './Header.module.css';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/assets/images/logo.svg';
import { useRouter } from 'next/router';
import Image from 'next/image';

export const Header = () => {
  const router = useRouter();
  const handleSignout = () => {
    // Hit backend api to invalidate the token
    router.push('/login');
    signOut({ redirect: false });
  };
  const { data: session }: any = useSession();
  return (
    <Paper className={styles.Header}>
      <Image src={Logo} style={{ margin: 4, marginLeft: 12 }} alt="ddp logo" />
      <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}>
        <Typography
          sx={{ fontWeight: 700 }}
          color="#000"
          data-testid="useremail"
        >
          {session?.user?.email || 'no user'}
        </Typography>
        <Button
          variant="contained"
          data-testid="signout"
          color="secondary"
          onClick={handleSignout}
          sx={{ m: 1 }}
        >
          Sign out
        </Button>
      </Box>
    </Paper>
  );
};
