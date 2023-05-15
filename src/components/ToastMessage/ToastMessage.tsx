import { Alert, Snackbar, Typography } from '@mui/material';
import React from 'react';
import { ToastStateInterface } from '@/contexts/reducers/ToastReducer';

const ToastMessage = ({
  open,
  severity,
  seconds,
  message,
  messages,
  handleClose,
}: ToastStateInterface) => {
  const handleCloseButton = () => {
    handleClose();
  };
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      open={open}
      onClose={handleCloseButton}
      autoHideDuration={seconds * 1000}
    >
      <Alert onClose={handleCloseButton} severity={severity}>
        {messages?.length
          ? messages.map((msg: string, idx: number) => (
              <Typography component="p" key={idx}>
                {msg}
              </Typography>
            ))
          : message}
      </Alert>
    </Snackbar>
  );
};

export default ToastMessage;
