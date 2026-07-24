import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1B4D3E'
    },
    secondary: {
      main: '#C45C26'
    },
    background: {
      default: '#F5F7F6',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#1A2421',
      secondary: '#5C6B66'
    },
    divider: '#D8E0DC'
  },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #D8E0DC',
          backgroundColor: '#FFFFFF'
        }
      }
    }
  }
})

export default theme
