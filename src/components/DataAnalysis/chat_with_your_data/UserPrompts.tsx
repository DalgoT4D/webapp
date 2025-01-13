import { Box } from '@mui/material';

export const UserPrompts = ({ input }) => {
  return (
    <>
      <Box
        key={input}
        sx={{ display: 'flex', justifyContent: 'flex-end', padding: '5px 30px 5px 0 ' }}
      >
        <Box
          sx={{ backgroundColor: '#0F2440AD', color: 'white', padding: '5px', borderRadius: '5px' }}
        >
          {input}
        </Box>
      </Box>
    </>
  );
};
