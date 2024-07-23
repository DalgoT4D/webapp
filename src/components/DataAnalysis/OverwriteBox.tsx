import { Box, Button, TextField, Typography } from '@mui/material';
import CloseIcon from '@/assets/icons/close_small.svg';
import Image from 'next/image';
export const OverWriteBox = () => {
  return (
    <>
      {/* main box */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          padding: '2.5rem 2rem',
          width: '40%',
          borderRadius: '10px',
          position: 'relative',
        }}
      >
        {/* headings */}
        <Image
          style={{
            width: '2.5rem',
            height: '2.5rem',
            position: 'absolute',
            top: '8%',
            right: '3%',
          }}
          src={CloseIcon}
          alt="info icon"
        />
        <Box>
          <Box>
            <Typography
              sx={{ color: '#000000', fontWeight: '600', fontSize: '1.5rem' }}
            >
              Overwrite Existing Session
            </Typography>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              The session with this name already exists. Do you want to
              overwrite?
            </Typography>
          </Box>

          {/* Input */}
          <Box sx={{ marginTop: '1.75rem' }}>
            <TextField name="overwrite" />
          </Box>
          {/* final box */}
          <Box
            sx={{
              marginTop: '1.5rem',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              sx={{
                width: '6.75rem',
                padding: '8px 0',
                borderRadius: '5px',
              }}
            >
              OverWrite
            </Button>
            <Button
              variant="outlined"
              sx={{
                width: '6.75rem',
                padding: '8px 0',
                borderRadius: '5px',
              }}
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
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
