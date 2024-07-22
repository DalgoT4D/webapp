import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export const FullPageLoader: React.FC = () => {
  return (
    <Box
      sx={{
        
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        gap: "1rem",
        flexDirection: "column",
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300,
      }}
    >
      <CircularProgress sx={{color: "#FFFFFF"}}/>
      <Typography sx={{ fontWeight: '600', fontSize: '20px', color: "#FFFFFF" }}>
        Prepping your data output...
      </Typography>
    </Box>
  );
};
