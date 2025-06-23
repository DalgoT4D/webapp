import React from 'react';
import { Box, Typography } from '@mui/material';

const NewIndexPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
      }}
    >
      <Typography variant="h3" gutterBottom>
        Welcome to the New Layout!
      </Typography>
      <Typography variant="body1">This is a simple blank page for the new UI.</Typography>
    </Box>
  );
};

export default NewIndexPage;
