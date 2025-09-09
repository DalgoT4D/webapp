import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { SessionProvider } from 'next-auth/react';
import { StyledEngineProvider } from '@mui/material/styles';
import { Main } from '@/components/Layouts/Main';
import ContextProvider from '@/contexts/ContextProvider';
import { TrackingProvider } from '@/contexts/TrackingContext';
import EmbeddedAuthInit from '@/components/EmbeddedAuthInit';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <ContextProvider value={1}>
      <main className={rajdhani.className}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SessionProvider session={session} refetchOnWindowFocus={false}>
              <EmbeddedAuthInit />
              <Main>
                <TrackingProvider session={session}>
                  <Component {...pageProps} />
                </TrackingProvider>
              </Main>
            </SessionProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </main>
    </ContextProvider>
  );
}
