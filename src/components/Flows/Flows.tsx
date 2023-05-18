import { Box, Button, Typography } from '@mui/material';
import React, { useState } from 'react';

interface FlowInterface {
  name: string;
  cron: string;
  deploymentName: string;
  deploymentId: string;
  lastRun: any;
}

interface FlowsInterface {
  flows: Array<FlowInterface>;
  updateCrudVal: (...args: any) => any;
}

const Flows = ({ flows, updateCrudVal }: FlowsInterface) => {
  const handleClickCreateFlow = () => {
    updateCrudVal('create');
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
          Flows
        </Typography>
        <Button
          variant="contained"
          onClick={handleClickCreateFlow}
          sx={{ m: 1 }}
        >
          + New Flow
        </Button>
      </Box>
      <Box sx={{ marginTop: '50px' }}>
        {flows.map((flow: FlowInterface, idx: number) => (
          <Box
            sx={{
              backgroundColor: 'white',
              padding: '15px',
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '8px',
            }}
            key={idx}
          >
            <Box>
              {flow.name} | cron: {flow.cron}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <Typography component="p" sx={{ color: '#399D47' }}>
                Running (dummy)
              </Typography>
              <Typography component="p">Last run 7 hrs ago (dummy)</Typography>
              <Button
                variant="contained"
                sx={{
                  m: 1,
                  backgroundColor: 'background.default',
                  color: 'secondary.main',
                  ':hover': { backgroundColor: 'background.default' },
                }}
              >
                last log
              </Button>
              <Button variant="contained" sx={{ m: 1 }}>
                Run
              </Button>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default Flows;
