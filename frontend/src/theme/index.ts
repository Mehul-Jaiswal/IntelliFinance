import { createTheme, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
    };
  }

  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
      success?: string;
      warning?: string;
      error?: string;
    };
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Modern indigo
      light: '#818cf8',
      dark: '#4f46e5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ec4899', // Modern pink
      light: '#f472b6',
      dark: '#db2777',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981', // Modern emerald
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b', // Modern amber
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444', // Modern red
      light: '#f87171',
      dark: '#dc2626',
    },
    background: {
      default: '#f8fafc', // Very light gray
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b', // Dark slate
      secondary: '#64748b', // Slate
    },
    gradient: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      warning: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 4px 8px -2px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px -4px rgba(0, 0, 0, 0.1)',
    '0px 16px 32px -8px rgba(0, 0, 0, 0.1)',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 16px 32px rgba(0, 0, 0, 0.12)',
    '0px 1px 3px rgba(0, 0, 0, 0.12)',
    '0px 3px 6px rgba(0, 0, 0, 0.15)',
    '0px 6px 12px rgba(0, 0, 0, 0.18)',
    '0px 12px 24px rgba(0, 0, 0, 0.2)',
    '0px 24px 48px rgba(0, 0, 0, 0.22)',
    '0px 2px 8px rgba(0, 0, 0, 0.1)',
    '0px 4px 16px rgba(0, 0, 0, 0.12)',
    '0px 8px 32px rgba(0, 0, 0, 0.14)',
    '0px 16px 64px rgba(0, 0, 0, 0.16)',
    '0px 32px 128px rgba(0, 0, 0, 0.18)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          color: '#1e293b',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            },
            '& .MuiListItemIcon-root': {
              color: 'white',
            },
          },
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);
