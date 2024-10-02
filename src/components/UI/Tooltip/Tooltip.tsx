import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import Typography from '@mui/material/Typography';

interface InfoTooltipProps {
  title: string | any;
  placement?: any;
}

function InfoTooltip({ title, placement = 'bottom' }: InfoTooltipProps) {
  return (
    <Tooltip
      placement={placement}
      title={<Typography sx={{ fontSize: '14px' }}>{title}</Typography>}
    >
      <InfoIcon
        className="infoIcon"
        fontSize="small"
        sx={{ color: '#888888', cursor: 'pointer' }}
      />
    </Tooltip>
  );
}

export default InfoTooltip;
