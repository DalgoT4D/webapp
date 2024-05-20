import React, { useEffect, useState } from 'react';
import styles from '@/styles/Home.module.css';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Box, Card, Typography } from '@mui/material';
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
      {elementaryToken && (
        <main className={styles.analysis}>
          <iframe
            src={backendUrl + `/elementary/${elementaryToken}`}
            width={'100%'}
            height={'800px'}
            style={{ border: 0 }}
          ></iframe>
        </main>
      )}
      {!elementaryToken && (
        <Card
          sx={{
            background: 'white',
            display: 'flex',
            borderRadius: '8px',
            padding: '16px',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6">No Elementary report available</Typography>
        </Card>
      )}
    </>
  );
};
