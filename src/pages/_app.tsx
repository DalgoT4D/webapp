import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { Box } from '@mui/material';
import { SideDrawer } from '@/components/SideDrawer/SideDrawer';
import { SWRConfig } from 'swr';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <SideDrawer />
          <CssBaseline />
          <SWRConfig
            value={{
              refreshInterval: 3000,
              fetcher: (resource, init) =>
                fetch(resource, {
                  headers: {
                    Authorization:
                      'Bearer 6f72efcd4b4e2bdc9a20703b07bc912c92172414',
                  },
                }).then((res) => res.json()),
            }}
          >
            <Component {...pageProps} />
          </SWRConfig>
        </Box>
      </ThemeProvider>
    </main>
  );
}
