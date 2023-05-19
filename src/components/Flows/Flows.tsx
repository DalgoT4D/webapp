import { Box, Button, IconButton, Typography } from '@mui/material';
import React, { useContext, useState } from 'react';
import { Delete } from '@mui/icons-material';
import { backendUrl } from '@/config/constant';
import { useSession } from 'next-auth/react';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';

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
  mutate: (...args: any) => any;
}

const Flows = ({ flows, updateCrudVal, mutate }: FlowsInterface) => {
  const handleClickCreateFlow = () => {
    updateCrudVal('create');
  };

  const { data: session }: any = useSession();
  const context = useContext(GlobalContext);

  const handleDeleteFlow = (deploymentId: string) => {
    (async () => {
      await fetch(`${backendUrl}/api/prefect/flows/${deploymentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.user.token}`,
        },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          mutate();
          if (data?.success)
            successToast('Flow deleted successfully', [], context);
          else errorToast('Something went wrong', [], context);
        })
        .catch((err) => {
          errorToast(String(err), [], context);
        });
    })();
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
              <IconButton onClick={() => handleDeleteFlow(flow.deploymentId)}>
                <Delete />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    </>
  );
};

export default Flows;
