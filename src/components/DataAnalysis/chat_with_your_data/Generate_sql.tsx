import { ArrowCircleUp } from '@mui/icons-material';
import { Box, Button, TextField } from '@mui/material';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';

export const GenerateSql = ({
  control,
  handleSubmit,
  onSubmit,
  aiGeneratedSql,
  thread_uuid,
}: any) => {
  useEffect(() => {
    if (thread_uuid) {
    }
  }, [thread_uuid]);
  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Controller
            name="promptToGenerateSql"
            control={control}
            render={({ field }) => (
              <TextField
                placeholder="Enter your customized prompt here"
                multiline
                rows={1}
                fullWidth
                {...field}
                sx={{
                  flexGrow: 1,
                  borderRadius: '5px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              />
            )}
          />
          <ArrowCircleUp
            onClick={handleSubmit(onSubmit)}
            sx={{ cursor: 'pointer', width: '50px', height: '50px', color: 'green' }}
          />
        </Box>

        {aiGeneratedSql && (
          <Box sx={{ marginTop: '1rem' }}>
            <TextField
              id="outlined-multiline-static"
              label="Generated SQL"
              multiline
              rows={4}
              fullWidth
              value={aiGeneratedSql}
              variant="outlined"
            />
            <Button>Run</Button>
          </Box>
        )}
      </Box>
    </>
  );
};
