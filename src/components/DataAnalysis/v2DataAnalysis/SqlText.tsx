import { Box, TextField, Typography } from '@mui/material';
import { Controller } from 'react-hook-form';

export const SQLText = ({ sqlText, control }: { sqlText: string; control: any }) => {
  return (
    <>
      {/* Placeholder Text Before SQL Appears */}
      {!sqlText && (
        <Typography sx={{ color: '#aaa', fontSize: '14px', fontStyle: 'italic', width: '100%' }}>
          SQL will appear here...
        </Typography>
      )}

      {/* SQL Message Bubble */}
      {sqlText && (
        <Box
          sx={{
            width: '100%',
            padding: '12px',
            // backgroundColor: '#E8F5F5',
            borderRadius: '10px',
            fontFamily: 'monospace',
            fontSize: '16px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <Controller
            name="sqlText"
            control={control}
            render={({ field }) => (
              <TextField
                data-testid="sqlTest-box"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  borderRadius: '6px',
                  width: '100%',
                }}
                placeholder={`SELECT * \nFROM table_name`}
                fullWidth
                multiline
                {...field}
              />
            )}
          />
        </Box>
      )}
    </>
  );
};
