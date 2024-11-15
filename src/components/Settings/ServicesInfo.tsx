import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useState } from 'react';
import { errorToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { Box, CircularProgress, Typography } from '@mui/material';
import AirbyteLogo from '@/assets/images/airbytelogo.webp';
import PrefectLogo from '@/assets/images/prefect-logo-black.png';
import DBT from '@/assets/images/dbt.png';
import Image from 'next/image';
const TOOLS_LOGO: any = {
  Airbyte: AirbyteLogo,
  Prefect: PrefectLogo,
  DBT: DBT,
  Elementary: AirbyteLogo,
  Superset: AirbyteLogo,
};
export const ServicesInfo = () => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loader, setLoader] = useState(false);
  const [toolInfo, setToolnfo] = useState([]);

  const getServicesVersions = async () => {
    setLoader(true);
    try {
      const { success, res } = await httpGet(session, `orgpreferences/toolinfo`);
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
      setToolnfo(res);
    } catch (error: any) {
      console.error(error);
      errorToast(error.message, [], globalContext);
    } finally {
      setLoader(false);
    }
  };
  useEffect(() => {
    if (session) {
      getServicesVersions();
    }
  }, [session]);
  if (loader) return <CircularProgress />;
  return (
    <>
      <Typography sx={{ color: '#7D8998', fontWeight: '700', fontSize: '14px', mt: '40px' }}>
        Component overview
      </Typography>
      <Box
        sx={{
          marginTop: '12px',
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
        }}
      >
        {!!toolInfo.length &&
          toolInfo.map((tool) => {
            const [toolName, toolData]: [toolName: string, toolData: any] = Object.entries(tool)[0];
            return (
              <Box
                key={toolName}
                sx={{
                  boxShadow: '0px 4px 8px 0px rgba(9, 37, 64, 0.08)',
                  display: 'flex',
                  borderRadius: '12px',
                  width: { xs: '100%', sm: '100%', lg: '49%' },
                  padding: '20px 0 20px 28px',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Image src={TOOLS_LOGO[toolName]} width={24} height={24} alt="images" />
                  <Typography
                    sx={{
                      color: '#00897B',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      marginLeft: '1rem',
                    }}
                  >
                    {toolName} &nbsp; {toolData.version}
                  </Typography>
                </Box>
              </Box>
            );
          })}
      </Box>
    </>
  );
};
