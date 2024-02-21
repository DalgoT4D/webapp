import { Box, Divider } from '@mui/material';
import React from 'react';
import Canvas from './Components/Canvas';
import ProjectTree from './Components/ProjectTree';
import PreviewPane from './Components/PreviewPane';

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
      <Box sx={{ display: 'flex', height: '70%', overflow: 'auto' }}>
        <Box sx={{ width: '20%' }}>
          <ProjectTree />
        </Box>
        <Divider orientation="vertical" sx={{ color: 'black' }} />
        <Box sx={{ width: '80%' }}>
          <Canvas />
        </Box>
      </Box>
      <Divider orientation="horizontal" sx={{ color: 'black' }} />
      <Box sx={{ height: '30%', overflow: 'auto' }}>
        <PreviewPane />
      </Box>
    </Box>
  );
};

export default FlowEditor;
