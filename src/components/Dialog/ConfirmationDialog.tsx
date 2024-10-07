import { Close } from '@mui/icons-material';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import React from 'react';

interface ConfirmationDialogProps {
  show: boolean;
  message: string;
  handleClose: (...args: any) => any;
  handleConfirm: (...args: any) => any;
  loading?: boolean;
}

const ConfirmationDialog = ({
  show,
  message,
  handleClose,
  handleConfirm,
  loading,
}: ConfirmationDialogProps) => {
  return (
    <Dialog open={show} onClose={handleClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>
            <Typography fontSize="24px" fontWeight="600">
              Are you ABSOLUTELY sure ?
            </Typography>
          </Box>
          <Box>
            <IconButton onClick={handleClose}>
              <Close data-testid="closeicon" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minWidth: '500px' }}>
        <Typography fontSize="20px" fontWeight="500">
          Please read before you continue!
        </Typography>
        <Typography
          data-testid="messageholder"
          component="p"
          marginTop="12px"
          fontSize="16px"
          fontWeight="500"
        >
          This action{' '}
          <Box component="span" fontWeight="700">
            cannot
          </Box>{' '}
          be undone. {message}
        </Typography>
      </DialogContent>

      <Backdrop open={loading !== undefined ? loading : false} sx={{ zIndex: '100' }}>
        <CircularProgress data-testid="circularprogress" color="info" />
      </Backdrop>
      <DialogActions sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}>
        <Button
          data-testid="confirmbutton"
          onClick={handleConfirm}
          sx={{
            width: '100%',
            fontWeight: '700',
            color: 'white',
            backgroundColor: '#890000',
            ':hover': {
              backgroundColor: '#890000',
            },
          }}
        >
          I Understand the consequences, confirm
        </Button>
        <Button
          data-testid="cancelbutton"
          color="secondary"
          variant="outlined"
          onClick={handleClose}
          sx={{ marginLeft: '5px' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
