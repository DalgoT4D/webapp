import { Close } from '@mui/icons-material';
import {
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
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ minWidth: '500px' }}>
        <Typography fontSize="20px" fontWeight="500">
          Please read before you continue!
        </Typography>
        <Typography
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

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <DialogActions sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}>
          <Button
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
            color="secondary"
            variant="outlined"
            onClick={handleClose}
            data-testid="cancel"
            sx={{ marginLeft: '5px' }}
          >
            Cancel
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ConfirmationDialog;
