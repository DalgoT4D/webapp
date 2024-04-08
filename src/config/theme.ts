import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { Rajdhani } from 'next/font/google';

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    shadow: true;
  }
}

export const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['devanagari'],
});

export const primaryColor = '#00897B';

// Create a theme instance.
const theme = createTheme({
  palette: {
    background: {
      default: '#F5FAFA',
    },
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: '#758397',
    },
    error: {
      main: red.A400,
    },
    info: {
      main: '#F5FAFA',
    },
  },
  components: {
    MuiDivider: {
      styleOverrides: {
        root: {
          fontSize: '12px',
          fontWeight: 700,
          color: '#0F244054',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          marginBottom: 10,
          color: '#758397',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          marginBottom: 10,
          color: '#758397',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          color: '#758397',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          width: '100%',
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: '#0F24408A',
          borderRadius: '6px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontWeight: 700,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '34px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '8px 14px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 8px rgba(9, 37, 64, 0.08);',
        },
      },
    },
    MuiButton: {
      variants: [
        {
          props: { variant: 'shadow' },
          style: {
            color: primaryColor,
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16)',
            border: `unset`,
          },
        },
        {
          props: { variant: 'shadow', color: 'error' },
          style: {
            color: '#ff1744',
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16)',
            border: `unset`,
          },
        },
      ],
      styleOverrides: {
        root: {
          '&.MuiButton-contained.Mui-disabled': {
            backgroundColor: 'rgba(0, 137, 123, 0.33)',
            color: '#fff',
          },
          boxShadow: 'unset',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: '6px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: { backgroundColor: '#0F2440DE' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '20px 33px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: '16px 33px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          '&.MuiDialog-paper': {
            minWidth: '560px',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1rem',
          paddingLeft: 0,
          paddingRight: 0,
          marginRight: '1rem',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 6px',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: 'transparent',
          boxShadow: 'none',
        },
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          background: 'white',
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        head: {
          borderRadius: '0px',
          transform: 'none',
          boxShadow: 'none',
        },
        root: {
          borderRadius: '12px',
          transform: 'scale(1)',
          boxShadow: '0px 1px 5px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        body: {
          border: 0,
        },
        head: {
          padding: '0.2rem',
          border: 0,
          overflow: 'hidden',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: {
          border: '0px',
        },
        root: {
          backgroundColor: '#F2F2EB',
        },
      },
    },
  },

  typography: {
    fontFamily: rajdhani.style.fontFamily,
  },
});

export default theme;
