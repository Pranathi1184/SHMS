import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0F766E', // Primary requested
    },
    secondary: {
      main: '#14B8A6', // Secondary requested
    },
    error: {
      main: '#EF4444',
    },
    background: {
      default: '#F8FAFC', // Background requested
    },
    accent: {
      main: '#2563EB', // Accent requested
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme;
