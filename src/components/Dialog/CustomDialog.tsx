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
    <Dialog
      open={show}
      onClose={handleClose}
      PaperProps={{
        sx: { borderRadius: "8px" },
      }}
    >
      <DialogTitle variant="h5" fontWeight={600} sx={{ pb: 1, pt: 4, pr: 2 }}>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>{title}</Box>
          <Box>
            <IconButton onClick={handleClose} data-testid="closebutton">
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ minWidth: '400px', py: 0 }}>
          {formContent}
        </DialogContent>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <CircularProgress data-testid="circularprogress" />
          </Box>
        ) : (
          <DialogActions
            sx={{ justifyContent: 'flex-start', padding: 4, pt: 0 }}
          >
            {formActions}
          </DialogActions>
        )}
      </form>
    </Dialog>
  );
};

export default CustomDialog;
