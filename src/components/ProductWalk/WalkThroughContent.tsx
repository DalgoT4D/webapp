import { Box } from '@mui/material';
import React from 'react';

interface WalkThroughContentProps {
  body: string;
}

export const WalkThroughContent = ({ body }: WalkThroughContentProps) => {
  // Your component logic here

  return <Box sx={{ fontSize: '20px' }}>{body}</Box>;
};
