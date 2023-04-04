import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { Rajdhani } from 'next/font/google';

export const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600'],
  subsets: ['devanagari'],
});

// Create a theme instance.
const theme = createTheme({
  palette: {
    primary: {
      main: '#00897B',
    },
    secondary: {
      main: '#003D37',
    },
    error: {
      main: red.A400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: '6px',
        },
      },
    },
  },

  typography: {
    fontFamily: rajdhani.style.fontFamily,
  },
});

export default theme;
