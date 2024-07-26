import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import * as amplitude from '@amplitude/analytics-browser';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { SessionProvider } from 'next-auth/react';
import { StyledEngineProvider } from '@mui/material/styles';
import { Main } from '@/components/Layouts/Main';
import ContextProvider from '@/contexts/ContextProvider';
import { useEffect } from 'react';
const amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_ENV!;
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  useEffect(() => {
    amplitude.init(amplitudeApiKey);
  }, []);
  return (
    <ContextProvider value={1}>
      <main className={rajdhani.className}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SessionProvider session={session} refetchOnWindowFocus={false}>
              <Main>
                <Component {...pageProps} />
              </Main>
            </SessionProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </main>
    </ContextProvider>
  );
}
