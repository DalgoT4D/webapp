import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { Box } from '@mui/material';
import { SWRConfig } from 'swr';

import { Main } from '@/components/Layouts/Main';
import { Auth } from '@/components/Layouts/Auth';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <SWRConfig
            value={{
              refreshInterval: 3000,
              fetcher: (resource, init) =>
                fetch(resource, {
                  headers: {
                    Authorization: 'Bearer ',
                  },
                }).then((res) => res.json()),
            }}
          >
            <Main>
              <Component {...pageProps} />
            </Main>
          </SWRConfig>
        </Box>
      </ThemeProvider>
    </main>
  );
}
