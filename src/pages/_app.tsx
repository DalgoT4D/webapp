import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { Box } from '@mui/material';
import { SWRConfig } from 'swr';
import { SessionProvider } from 'next-auth/react';

import { Main } from '@/components/Layouts/Main';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <SessionProvider session={session}>
            <Main>
              <Component {...pageProps} />
            </Main>
          </SessionProvider>
        </Box>
      </ThemeProvider>
    </main>
  );
}
