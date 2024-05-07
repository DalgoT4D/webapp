import { Box, Button } from '@mui/material';
import React from 'react';

interface CreateTableAddFunctionProps {
  clickCreateTable: () => void;
  clickAddFunction: () => void;
  showAddFunction: boolean;
}

const CreateTableOrAddFunction = ({
  clickCreateTable,
  clickAddFunction,
  showAddFunction,
}: CreateTableAddFunctionProps) => {
  return (
    <Box
      sx={{
        padding: '32px 16px 0px 16px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <Button variant="outlined" onClick={clickCreateTable}>
        Create a table
      </Button>

      {showAddFunction && (
        <Button variant="outlined" onClick={clickAddFunction}>
          Add function
        </Button>
      )}
    </Box>
  );
};

export default CreateTableOrAddFunction;
