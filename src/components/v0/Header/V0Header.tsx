import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const V0Header: React.FC = () => {
  return (
    <AppBar position="static" sx={{ background: '#3949ab' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          New Layout Header
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default V0Header;
