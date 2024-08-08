import React, { useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import { httpGet, httpPost } from '@/helpers/http';
import moment from 'moment';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast, successToast } from '../ToastMessage/ToastHelper';
import { delay } from '@/utils/common';
import SyncIcon from '@/assets/icons/sync.svg';
import Image from 'next/image';
import styles from '@/styles/Common.module.css';

export const Elementary = () => {
  const [loading, setLoading] = useState(true);
  const [elementaryToken, setElementaryToken] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [generateReportLock, setGenerateReportLock] = useState(false);
  const globalContext = useContext(GlobalContext);
  const { data: session }: any = useSession();

  const refreshReport = async () => {
    if (!session) return;
    try {
      setGenerateReportLock(true);
      const response = await httpPost(
        session,
        'dbt/v1/refresh-elementary-report/',
        {}
      );

      if (response.flow_run_id) {
        successToast(
          'Your latest report is being generated. This may take a few minutes. Thank you for your patience',
          [],
          globalContext
        );
        checkForLock();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
      setGenerateReportLock(false);
    }
  };

  const fetchElementaryToken = async () => {
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

  const checkForLock = async () => {
    try {
      const response = await httpGet(session, `prefect/tasks/elementary-lock/`);
      if (response && !generateReportLock) {
        setGenerateReportLock(true);
        await delay(5000);

        checkForLock();
      } else if (generateReportLock) {
        setGenerateReportLock(false);
        successToast('Report generated successfully', [], globalContext);
        fetchElementaryToken();
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
      setGenerateReportLock(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchElementaryToken();
      checkForLock();
    }
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
            disabled={generateReportLock}
            variant="contained"
          >
            {generateReportLock ? (
              <>
                <Image
                  src={SyncIcon}
                  className={styles.SyncIcon}
                  alt="sync icon"
                  style={{ marginRight: '4px' }}
                  data-testid="sync-icon"
                />
                Generating report
              </>
            ) : (
              ' Regenerate report'
            )}
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
