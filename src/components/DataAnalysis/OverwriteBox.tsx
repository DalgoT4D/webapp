import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import Image from 'next/image';
import CloseIcon from '@/assets/icons/close_small.svg';

export const OverWriteDialog = ({ open, setIsBoxOpen, sessionName }: { open: boolean, sessionName: string, setIsBoxOpen: (a: boolean) => void }) => {
  const [newSessionName, setNewSessionName] = useState(sessionName);
  const handleClose = () => (setIsBoxOpen(false));
  return (
    <>
      {/* Dialog Box */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        {/* Dialog Title with close button */}
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Typography
              sx={{ color: '#000000', fontWeight: '600', fontSize: '1.5rem' }}
            >
              Overwrite Existing Session
            </Typography>
            <IconButton
              sx={{ marginLeft: 'auto' }}
              onClick={handleClose}
              aria-label="close"
            >
              <Image src={CloseIcon} alt="Close" width={20} height={20} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent>
          <Typography
            sx={{
              fontWeight: '600',
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            The session with this name already exists. Do you want to overwrite?
          </Typography>

          {/* Input Field */}
          <Box sx={{ marginTop: '1.75rem' }}>
            <TextField
              name="overwrite"
              fullWidth
              label="Session Name"
              variant="outlined"
              value={newSessionName}
              onChange={(e) => { setNewSessionName(e.target.value) }}
            />
          </Box>
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ padding: '1.5rem', display: 'flex', gap: '12px' }}>
          <Button
            variant="contained"
            sx={{
              width: '6.75rem',
              padding: '8px 0',
              borderRadius: '5px',
            }}
            onClick={handleClose} // Overwrite logic here
          >
            Overwrite
          </Button>
          <Button
            variant="outlined"
            sx={{
              width: '6.75rem',
              padding: '8px 0',
              borderRadius: '5px',
            }}
            onClick={handleClose} // Save as new logic here
          >
            Save as new
          </Button>
          <Button
            variant="outlined"
            sx={{
              width: '6.75rem',
              padding: '8px 0',
              borderRadius: '5px',
            }}
            onClick={handleClose}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};


