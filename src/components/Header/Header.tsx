import { Box, Button, Paper, Typography } from '@mui/material';
import styles from './Header.module.css';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

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
      <Box display="flex" justifyContent="flex-end" alignItems="center">
        <Typography sx={{ fontWeight: 700 }} color="#000">
          {session?.user?.email || 'no user'}
        </Typography>
        <Button
          variant="contained"
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
