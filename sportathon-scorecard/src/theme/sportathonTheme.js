import { createTheme } from '@mui/material/styles';

/** Shared dark “stadium” palette — matches LiveScorecard styling */
export const sportathonTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#d4af37',
      dark: '#a88a2a',
      light: '#e4c86a',
      contrastText: '#0a0f18',
    },
    secondary: {
      main: '#00b4d8',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ff4757',
    },
    success: {
      main: '#43a047',
    },
    info: {
      main: '#29b6f6',
    },
    warning: {
      main: '#ffa726',
    },
    background: {
      default: '#050a12',
      paper: 'rgba(18, 28, 48, 0.92)',
    },
    text: {
      primary: '#e8edf5',
      secondary: '#8b9cb3',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontFamily: '"Bebas Neue", "Impact", sans-serif',
      letterSpacing: '0.06em',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"Bebas Neue", "Impact", sans-serif',
      letterSpacing: '0.06em',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"Bebas Neue", "Impact", sans-serif',
      letterSpacing: '0.05em',
      fontWeight: 400,
    },
    h6: {
      fontFamily: '"Outfit", sans-serif',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: 'rgba(212, 175, 55, 0.35) transparent',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #0a1628 0%, #122038 45%, #0d2848 100%)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.35)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 56,
          '@media (min-width:0px)': {
            minHeight: 56,
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
        },
        outlined: {
          borderWidth: 2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        SelectProps: {
          MenuProps: {
            PaperProps: {
              className: 'lsc-menu-paper',
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        },
        notchedOutline: {
          borderColor: 'rgba(255, 255, 255, 0.22)',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(232, 237, 245, 0.85)',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: '#d4af37',
          '&.Mui-focused': {
            color: '#d4af37',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(165deg, #122038, #0a1424)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: 16,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 45, 70, 0.95)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#d4af37',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
        body: {
          borderColor: 'rgba(255, 255, 255, 0.06)',
          color: '#e8edf5',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.55)',
          '&.Mui-checked': {
            color: '#d4af37',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#d4af37',
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: 'rgba(212, 175, 55, 0.35)',
          },
        },
        track: {
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          color: '#e8edf5',
        },
      },
    },
  },
});
