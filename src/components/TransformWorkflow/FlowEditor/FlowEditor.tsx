import { Box } from '@mui/material';
import React from 'react';

const FlowEditor = ({}) => {
  return (
    <Box
      sx={{
        overflow: 'hidden',
        flexDirection: 'column',
        height: '100vh',
        paddingTop: '3.5rem',
      }}
    >
      <Box sx={{ display: 'flex', height: '50%', overflow: 'auto' }}>
        <Box width="20%" sx={{ background: 'yellow' }}>
          Dir Structure
        </Box>
        <Box width="80%" sx={{ background: 'red' }}>
          FlowCanvas
        </Box>
      </Box>
      <Box sx={{ height: '50%', overflow: 'auto', background: 'grey' }}>
        Preview
      </Box>
    </Box>
  );
};

export default FlowEditor;
