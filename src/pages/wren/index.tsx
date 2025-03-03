import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet } from '@/helpers/http';
import { Box, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
const MyIFrame = () => {
  const globalContext = useContext(GlobalContext);
  const { data: session } = useSession();
  const [wrenUrl, setWrenUrl] = useState('');

  const fetchWrenUrl = async () => {
    try {
      const response = await httpGet(session, `organizations/wren`);
      if (!response.hostname) {
        errorToast('No hostname found for Wren', [], globalContext);
      }
      const { hostname, port } = response;
      setWrenUrl(`http://${hostname}:${port}/`);
    } catch (error: any) {
      errorToast(error.message, [], globalContext);
      console.error(error, 'error');
    }
  };
  useEffect(() => {
    if (session) {
      fetchWrenUrl();
    }
  }, [session]);
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <div style={{ width: '95%', height: '90vh', border: '1px solid #ddd', margin: '2rem 2rem' }}>
        {wrenUrl ? (
          <iframe
            src={wrenUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Embedded Page"
          />
        ) : (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <Typography variant="h6" fontSize={'1.5rem'} color="textSecondary">
              Wren AI has not been setup for this organization
            </Typography>
          </Box>
        )}
      </div>
    </Box>
  );
};

export default MyIFrame;
