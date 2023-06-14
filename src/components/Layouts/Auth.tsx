import { Box, Grid, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import Banner from '@/assets/images/banner.png';
import Logo from '@/assets/images/logo.svg';
import { ReactNode } from 'react';

type AuthProps = {
  children: ReactNode;
  heading: string;
  subHeading: string;
};
export const Auth: React.FC<AuthProps> = ({
  heading,
  subHeading,
  children,
}) => {
  return (
    <Box>
      <Grid container columns={16}>
        <Grid item xs={8}>
          <Grid
            container
            height="100vh"
            direction="column"
            justifyContent="center"
            alignItems="center"
          >
            <Image src={Logo} alt="ddp logo" />
            <Paper
              sx={{
                p: 4,
                mt: 5,
                maxWidth: 414,
                boxShadow: '0px 6px 11px rgba(64, 68, 77, 0.06)',
              }}
            >
              <Typography variant="h5" align="center" fontWeight={600}>
                {heading}
              </Typography>
              {subHeading && (
                <Typography variant="body1" color="#0F244054" align="center">
                  {subHeading}
                </Typography>
              )}
              {children}
            </Paper>
            <Typography
              variant="body1"
              sx={{ position: 'absolute', bottom: 20 }}
              mt={2}
            >
              © 2023 DDP. All Rights Reserved.
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
