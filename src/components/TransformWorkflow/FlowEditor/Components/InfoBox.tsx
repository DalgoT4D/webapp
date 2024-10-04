import { Box, Typography } from '@mui/material';

const InfoBox = ({ text }: { text: string }) => {
  return (
    <Box
      sx={{
        marginTop: '17px',
        border: '1px solid #999999',
        backgroundColor: '#F4F4F4',
        borderRadius: '6px',
        padding: '10px',
        width: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex' }}>
          <Box sx={{ height: '16px', width: '16px' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="'16px"
              height="'16px"
              viewBox="0 0 24 24"
            >
              <path d="M13 13h-2V7h2m0 10h-2v-2h2M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2" />
            </svg>
          </Box>
          <Box
            sx={{
              color: '#2e2e2e',
              fontWeight: 600,
              fontSize: '15px',
              lineHeight: '18px',
              marginLeft: '5px',
            }}
          >
            NOTE
          </Box>
        </Box>
        <Box>
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"
            />
          </svg>
        </Box>
      </Box>
      <Box sx={{ paddingLeft: '20px', paddingRight: '20px' }}>
        <Typography color="#777777" fontWeight={600} lineHeight="18px">
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

export default InfoBox;
