import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import Typography from '@mui/material/Typography';

interface InfoTooltipProps {
  title: string;
}

function InfoTooltip({ title }: InfoTooltipProps) {
  return (
    <Tooltip title={<Typography sx={{ fontSize: '14px' }}>{title}</Typography>}>
      <InfoIcon fontSize="small" sx={{ color: '#888888' }} />
    </Tooltip>
  );
}

export default InfoTooltip;
