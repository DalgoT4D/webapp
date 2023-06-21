import { Box, Menu, MenuItem, Paper, Typography } from '@mui/material';
import styles from './Header.module.css';
import ProfileIcon from '@/assets/icons/profile.svg';
import LogoutIcon from '@/assets/icons/logout.svg';
import { signOut, useSession } from 'next-auth/react';
import Logo from '@/assets/images/logo.svg';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useState } from 'react';

export const Header = () => {
  const router = useRouter();
  const handleSignout = () => {
    // Hit backend api to invalidate the token
    router.push('/login');
    signOut({ redirect: false });
  };
  const { data: session }: any = useSession();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: HTMLElement | null) => {
    setAnchorEl(event);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <Paper className={styles.Header}>
      <Image src={Logo} style={{ margin: 4, marginLeft: 12 }} alt="ddp logo" />
      <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}>
        <Image
          style={{ marginRight: 24, cursor: 'pointer' }}
          src={ProfileIcon}
          alt="profile icon"
          onClick={(event) => handleClick(event.currentTarget)}
        />
      </Box>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        sx={{ marginTop: 4, marginLeft: -2, paddingRight: 2, py: 0 }}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          className: styles.Paper,
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        MenuListProps={{
          sx: { p: 0 },
          'aria-labelledby': 'basic-button',
        }}
      >
        <Box sx={{ my: 0, py: 1, px: 2 }} onClick={handleClose}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              borderBottom: '0.5px solid rgba(15, 36, 64, 0.5)',
            }}
          >
            {session?.user?.email || 'no user'}
          </Typography>
        </Box>

        <MenuItem onClick={() => handleSignout()}>
          <Image
            style={{ marginRight: 8 }}
            src={LogoutIcon}
            alt="logout icon"
          />
          Logout
        </MenuItem>
      </Menu>
    </Paper>
  );
};
