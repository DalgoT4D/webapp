import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import { httpPost } from '@/helpers/http';
import moment from 'moment';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';

export const Elementary = () => {
  const [loading, setLoading] = useState(true);
  const [elementaryToken, setElementaryToken] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();

  const refreshReport = async () => {
    if (!session) return;
    try {
      const response = await httpPost(
        session,
        'dbt/refresh-elementary-report/',
        {}
      );
      if (response.task_id) {
        successToast(
          'Your latest report is being generated. This may take a few moments. Thank you for your patience',
          [],
          globalContext
        );
      }
      console.log(response);
    } catch (err: any) {
      console.error(err);
      errorToast(
        'Error while generating report. Please contact support',
        [],
        globalContext
      );
    }
  };

  const fetchElementaryToken = async () => {
    if (!session) return;
    try {
      const response = await httpPost(
        session,
        'dbt/make-elementary-report/',
        {}
      );

      if (response.token) {
        setElementaryToken(response.token);
        setGeneratedAt(moment(response.created_on_utc).fromNow());
      }
    } catch (err: any) {
      console.error(err);
      // don't show errorToast
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElementaryToken();
  }, []);

  return (
    <>
      <Box sx={{ width: '100%', p: 3 }}>
        <Box sx={{ display: 'flex', mb: 2 }}>
          <Button
            sx={{ ml: 'auto' }}
            onClick={() => refreshReport()}
            variant="contained"
          >
            Regerate report
          </Button>
        </Box>
        <Card
          sx={{
            background: 'white',
            display: 'flex',
            borderRadius: '8px',
            padding: '16px',
            height: '100%',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : elementaryToken ? (
            <Box width={'100%'} height={'calc(100vh - 250px)'}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="h6">
                  <strong> Last generated:</strong> {generatedAt}
                </Typography>
              </Box>

              <iframe
                src={backendUrl + `/elementary/${elementaryToken}`}
                width={'100%'}
                height={'100%'}
                style={{ border: 0 }}
              ></iframe>
            </Box>
          ) : (
            <Typography variant="h6">No Elementary report available</Typography>
          )}
        </Card>
      </Box>
    </>
  );
};
