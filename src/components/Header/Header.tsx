import { Box, Button, Paper } from '@mui/material';
import styles from './Header.module.css';
import { signOut } from 'next-auth/react';

export const Header = () => {
  return (
    <Paper className={styles.Header}>
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="secondary"
          onClick={() => signOut()}
          sx={{ m: 1 }}
        >
          Sign out
        </Button>
      </Box>
    </Paper>
  );
};
