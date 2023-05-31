import { Close } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import React from 'react';

interface CustomDialogProps {
  title: string;
  show: boolean;
  handleClose: (...args: any) => any;
  handleSubmit: (...args: any) => any;
  formContent: any;
  formActions: any;
  loading?: boolean;
}

const CustomDialog = ({
  formContent,
  formActions,
  title,
  show,
  handleClose,
  handleSubmit,
  loading,
}: CustomDialogProps) => {
  return (
    <Dialog open={show} onClose={handleClose}>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>{title}</Box>
          <Box>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ minWidth: '400px' }}>{formContent}</DialogContent>
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
          <DialogActions
            sx={{ justifyContent: 'flex-start', padding: '1.5rem' }}
          >
            {formActions}
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default CustomDialog;
