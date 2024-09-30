import React from 'react';
import { Box } from '@mui/material';

interface FullPageBackgroundProps {
  children: React.ReactNode;
}

export const FullPageBackground: React.FC<FullPageBackgroundProps> = ({ children }) => {
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
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300,
      }}
    >
      {children}
    </Box>
  );
};
