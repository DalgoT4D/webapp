import { Box, Button, Divider, Link, Typography } from '@mui/material';
import React from 'react';
import { useForm } from 'react-hook-form';

interface FlowCreateInterface {
  updateCrudVal: (...args: any) => any;
}

const FlowCreate = ({ updateCrudVal }: FlowCreateInterface) => {
  const { register, handleSubmit, control, watch, reset, setValue } = useForm({
    defaultValues: {
      name: '',
      sourceDef: { id: '', label: '' },
      config: {},
    },
  });

  const handleClickCancel = () => {
    updateCrudVal('index');
  };
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          sx={{ fontWeight: 700 }}
          variant="h4"
          gutterBottom
          color="#000"
        >
          Create a new Flow
        </Typography>
        <Box>
          <Link
            onClick={handleClickCancel}
            sx={{ m: 1, ':hover': { cursor: 'pointer' } }}
          >
            Cancel
          </Link>
          <Button variant="contained" sx={{ m: 1 }}>
            Save changes
          </Button>
        </Box>
      </Box>
      <form>
        <Box
          sx={{
            marginTop: '50px',
            backgroundColor: 'white',
            padding: '33px 50px 33px 50px',
            display: 'flex',
            height: '500px',
            gap: '50px',
          }}
        >
          <Box sx={{ width: '60%', backgroundColor: 'yellow' }}>
            <Typography variant="h5" sx={{ marginBottom: '10px' }}>
              Flow details
            </Typography>
            <Box>ishan</Box>
          </Box>
          <Divider orientation="vertical" />
          <Box sx={{ width: '40%', backgroundColor: 'yellow' }}>
            <Typography variant="h5">Schedule</Typography>
          </Box>
        </Box>
      </form>
    </>
  );
};

export default FlowCreate;
