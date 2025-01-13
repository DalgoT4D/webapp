import { Box } from '@mui/material';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Responses = ({ input }) => {
  return (
    <>
      <Box
        key={input}
        sx={{ display: 'flex', justifyContent: 'flex-start', padding: '5px 0 5px 30px' }}
      >
        <Box
          sx={{
            backgroundColor: '#F4F9F9',
            color: '#0F2440',
            padding: '5px',
            borderRadius: '5px',
            maxWidth: '90%',
          }}
        >
          <Markdown remarkPlugins={[remarkGfm]}>{input}</Markdown>
        </Box>
      </Box>
    </>
  );
};
