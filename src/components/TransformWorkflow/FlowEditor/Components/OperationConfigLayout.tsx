import { Box, SxProps } from '@mui/material';
import React from 'react';

interface OperationConfigProps {
  sx: SxProps;
  openConfigPanel: boolean;
  setOpenConfigPanel: (...args: any) => void;
}

const OperationConfigLayout = ({
  openConfigPanel,
  setOpenConfigPanel,
  sx,
}: OperationConfigProps) => {
  if (!openConfigPanel) return null;
  return <Box sx={{ ...sx }}>Operation config form</Box>;
};

export default OperationConfigLayout;
