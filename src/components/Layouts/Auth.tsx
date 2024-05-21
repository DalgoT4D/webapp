import { Box, Grid, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import Banner from '@/assets/images/banner.png';
import Logo from '@/assets/images/logo.svg';
import { ReactNode } from 'react';

type AuthProps = {
  children: ReactNode;
  heading: string;
  subHeading?: string;
};
export const Auth: React.FC<AuthProps> = ({
  heading,
  subHeading,
  children,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container columns={16}>
        <Grid
          item
          xs={8}
          sx={{
            pt: '60px',
            overflow: 'scroll',
            height: '100vh  ',
          }}
        >
          <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
          >
            <Image src={Logo} alt="dalgo logo" />
            <Paper
              sx={{
                p: 4,
                mt: 5,
                width: 414,
                boxShadow: '0px 6px 11px rgba(64, 68, 77, 0.06)',
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" align="center" fontWeight={600}>
                  {heading}
                </Typography>
                {subHeading && (
                  <Typography variant="body1" color="#0F244054" align="center">
                    {subHeading}
                  </Typography>
                )}
              </Box>
              {children}
              <Box sx={{display: 'flex', justifyContent: 'center'}}>
                <Typography variant="body1"  >
                    <a href="https://dalgo.in/privacy-policy/" target="_blank">Privacy Policy</a>
                </Typography>
              </Box>
            </Paper>
            <Typography variant="body1" mt={4} pb={3}>
              2023, DALGO ALL RIGHTS RESERVED
            </Typography>
          </Grid>
        </Grid>

        <Grid item xs={8}>
          <Box
            sx={{
              background: `url(${Banner.src}) center no-repeat`,
              backgroundSize: 'cover',
              width: '100%',
              height: '100vh',
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Auth;
