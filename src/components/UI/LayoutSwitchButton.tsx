import React from 'react';
import { Fab } from '@mui/material';

interface LayoutSwitchButtonProps {
  onSwitch: () => void;
  isNewLayout: boolean;
}

const buttonStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 2000,
};

export const LayoutSwitchButton: React.FC<LayoutSwitchButtonProps> = ({
  onSwitch,
  isNewLayout,
}) => {
  return (
    <Fab
      color={isNewLayout ? 'primary' : 'secondary'}
      variant="extended"
      style={buttonStyle}
      onClick={onSwitch}
      aria-label="Switch Layout"
    >
      {isNewLayout ? 'Switch to Old Layout' : 'Try New Layout'}
    </Fab>
  );
};

export default LayoutSwitchButton;
