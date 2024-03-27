import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';

interface InfoTooltipProps {
  title: string;
}

function InfoTooltip({ title }: InfoTooltipProps) {
  return (
    <Tooltip title={title}>
      <InfoIcon fontSize="small" sx={{ color: '#888888' }} />
    </Tooltip>
  );
}

export default InfoTooltip;
