import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { rajdhani } from '@/config/theme';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/config/theme';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={rajdhani.className}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </main>
  );
}
