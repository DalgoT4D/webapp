import React, { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Box, Button, Card, Typography } from '@mui/material';
import { httpPost } from '@/helpers/http';

export const Elementary = () => {
  const [elementaryToken, setElementaryToken] = useState<string>('');
  const { data: session }: any = useSession();

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
      }
    } catch (err: any) {
      console.error(err);
      // don't show errorToast
    }
  };

  useEffect(() => {
    fetchElementaryToken();
  }, []);

  return (
    <>
      <main className={styles.analysis}>
        <Card
          sx={{
            background: 'white',
            display: 'flex',
            borderRadius: '8px',
            padding: '16px',
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {elementaryToken ? (
            <Box>
              <Box sx={{ display: 'flex' }}>
                <Typography>Last generated: </Typography>
                <Button sx={{ ml: 'auto' }} variant="contained">
                  Generate new
                </Button>
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
      </main>
    </>
  );
};
