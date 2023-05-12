import { Box, Button, Paper } from '@mui/material';
import styles from './Header.module.css';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

export const Header = () => {
  const router = useRouter();
  const handleSignout = () => {
    // Hit backend api to invalidate the token
    router.push('/login');
    signOut({ redirect: false });
  };
  return (
    <Paper className={styles.Header}>
      <Box display="flex" justifyContent="flex-end">
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
