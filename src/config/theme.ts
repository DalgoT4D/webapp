import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { Rajdhani } from 'next/font/google';

export const rajdhani = Rajdhani({
  weight: ['300', '400', '500', '600', "700"],
  subsets: ['devanagari'],
});

const primaryColor = '#00897B';

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
      main: '#003D37',
    },
    error: {
      main: red.A400,
    },
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
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
          minWidth: '34px'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: '6px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: "1rem",
          paddingLeft: 0,
          paddingRight: 0,
          marginRight: '1rem'

        }
      }
    },
    MuiTable: {
      styleOverrides:
      {
        root: {
          borderCollapse: 'separate',
          borderSpacing: '0 15px'
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          background: "transparent",
          boxShadow: 'none'
        }
      }
    },

    MuiTableBody: {
      styleOverrides: {
        root: {
          background: "white"
        }
      }
    },

    MuiTableRow: {
      styleOverrides: {
        head: {
          borderRadius: '0px',
          transform: 'none',
          boxShadow: "none",
        },
        root: {
          borderRadius: '12px',
          transform: 'scale(1)',
          boxShadow: "0px 1px 5px rgba(0,0,0,0.1)",
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        body: {
          border: 0,
        },
        head: {
          padding: "0.2rem",
          border: 0,
          overflow: 'hidden'
        }
      }
    }
  },


  typography: {
    fontFamily: rajdhani.style.fontFamily,
  },
});

export default theme;
