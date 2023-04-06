import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';
import { Box } from '@mui/material';
import { SideDrawer } from '@/components/SideDrawer/SideDrawer';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex' }}>
          <SideDrawer />
          <CssBaseline />
          <Component {...pageProps} />
        </Box>
      </ThemeProvider>
    </main>
  );
}
