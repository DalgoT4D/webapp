import { Box, Button, TextField, Typography } from '@mui/material';
import CloseIcon from '@/assets/icons/close_small.svg';
import Image from 'next/image';
export const FeedBackForm = () => {
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
              Provide additional feedback
            </Typography>
            <Typography
              sx={{
                fontWeight: '600',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              Tell us why this response was unsatisfactory{' '}
            </Typography>
          </Box>

          {/* Input */}
          <Box sx={{ marginTop: '1.75rem' }}>
            <TextField
              name="overwrite"
              multiline
              rows={6}
              placeholder="Type your message here..."
            />
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
              Submit
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};
