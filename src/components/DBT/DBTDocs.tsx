import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backendUrl } from '@/config/constant';
import { Card, Typography } from '@mui/material';
import { httpPost } from '@/helpers/http';

export const DBTDocs = () => {
  const [dbtDocsToken, setDbtDocsToken] = useState<string>('');
  const { data: session }: any = useSession();

  const fetchDbtDocsToken = async () => {
    if (!session) return;
    try {
      const response = await httpPost(session, 'dbt/makedocs/', {});
      if (response.token) {
        setDbtDocsToken(response.token);
      }
    } catch (err: any) {
      console.error(err);
      // don't show errorToast
    }
  };

  useEffect(() => {
    fetchDbtDocsToken();
  }, []);

  return (
    <>
      {dbtDocsToken && (
        <Card sx={{ mt: 2 }}>
          <iframe
            src={backendUrl + `/docs/${dbtDocsToken}`}
            width={'100%'}
            height={'600px'}
            style={{ border: 0 }}
          ></iframe>
        </Card>
      )}
      {!dbtDocsToken && (
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
          <Typography variant="h6">
            dbt Docs have not been generated yet
          </Typography>
        </Card>
      )}
    </>
  );
};
