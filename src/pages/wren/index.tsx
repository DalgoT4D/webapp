import { Box } from '@mui/material';
import React from 'react';

const MyIFrame = () => {
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <div style={{ width: '95%', height: '90vh', border: '1px solid #ddd', margin: '2rem 2rem' }}>
        <iframe
          src="https://wren.dalgo.in/modeling"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="Embedded Page"
        />
      </div>
    </Box>
  );
};

export default MyIFrame;
