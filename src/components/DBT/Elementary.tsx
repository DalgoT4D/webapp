import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import { httpGet, httpPost } from '@/helpers/http';
import moment from 'moment';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { delay } from '@/utils/common';

export const Elementary = () => {
  const [loading, setLoading] = useState(true);
  const [elementaryToken, setElementaryToken] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [refreshTTL, setRefreshTTL] = useState<number>(0);
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();

  const decreaseTTL = useCallback(() => {
    setRefreshTTL((prevTTL) => {
      if (prevTTL <= 0) {
        return 0;
      }
      return prevTTL - 1;
    });
  }, []);

  const checkRefresh = async function (task_id: string) {
    const refreshResponse = await httpGet(session, 'tasks/stp/' + task_id);
    if (refreshResponse.progress && refreshResponse.progress.length > 0) {
      const lastStatus =
        refreshResponse.progress[refreshResponse.progress.length - 1].status;
      // running | failed | completed
      if (lastStatus === 'failed') {
        errorToast('Failed to generate report', [], globalContext);
        return;
      } else if (lastStatus === 'completed') {
        successToast('Report generated successfully', [], globalContext);
        fetchElementaryToken();
        return;
      }
    }
    // else poll again
    await delay(2000);
    await checkRefresh(task_id);
  };

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
          'Your latest report is being generated. This may take a few minutes. Thank you for your patience',
          [],
          globalContext
        );
        // 1. grey out the refresh button and show a countdown timer
        setRefreshTTL(response.ttl);
        // 2. poll for the task status
        checkRefresh(response.task_id);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    }
  };

  useEffect(() => {
    const timer = setTimeout(decreaseTTL, 1000);
    return () => clearTimeout(timer);
  }, [decreaseTTL, refreshTTL]);

  const fetchElementaryToken = async () => {

    if (!session) return;
    try {
      const response = await httpPost(
        session,
        'dbt/fetch-elementary-report/',
        {}
      );

      if (response.token) {
        setElementaryToken(response.token);
        setGeneratedAt(moment(response.created_on_utc).fromNow());
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchElementaryToken();
  }, []);

  return (
    <>
      <Box data-testid="outerbox" sx={{ width: '100%', pt: 3, pr: 3, pl: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            mb: 1,
          }}
        >
          {elementaryToken && (
            <Typography variant="h6">
              <strong> Last generated:</strong> {generatedAt}
            </Typography>
          )}

          <Button
            sx={{ ml: 'auto' }}
            onClick={() => refreshReport()}
            disabled={refreshTTL > 0}
            variant="contained"
          >
            Regenerate report {refreshTTL > 0 ? `(${refreshTTL}s)` : ''}
          </Button>
        </Box>
        <Card
          sx={{
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            height: '100%',
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : elementaryToken ? (
            <Box width="100%" height="calc(100vh - 210px)" sx={{ flexGrow: 1 }}>
              <iframe
                src={backendUrl + `/elementary/${elementaryToken}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
              ></iframe>
            </Box>
          ) : (
            <Typography variant="h6">
              No report available. Please click on the button above to generate
              if you believe a report should be available.
            </Typography>
          )}
        </Card>
      </Box>
    </>
  );
};
