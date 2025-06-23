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
import { NewLayout } from '@/components/Layouts/NewLayout';
import LayoutSwitchButton from '@/components/UI/LayoutSwitchButton';
import React, { useEffect, useState } from 'react';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [isNewLayout, setIsNewLayout] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('use-new-layout');
      setIsNewLayout(stored === 'true');
    }
  }, []);

  const handleSwitch = () => {
    const next = !isNewLayout;
    setIsNewLayout(next);
    localStorage.setItem('use-new-layout', next ? 'true' : 'false');
  };

  const Layout = isNewLayout ? NewLayout : Main;

  return (
    <ContextProvider value={1}>
      <main className={rajdhani.className}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SessionProvider session={session} refetchOnWindowFocus={false}>
              <Layout>
                <TrackingProvider session={session}>
                  <Component {...pageProps} />
                </TrackingProvider>
                <LayoutSwitchButton onSwitch={handleSwitch} isNewLayout={isNewLayout} />
              </Layout>
            </SessionProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </main>
    </ContextProvider>
  );
}
