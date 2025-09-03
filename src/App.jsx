import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  FitnessCenter as ExerciseIcon,
  Timeline as HistoryIcon,
  Assignment as WorkoutIcon
} from '@mui/icons-material';

// Importa i componenti delle sezioni
import DatabaseEsercizi from './components/DatabaseEsercizi';
import StoricoProgressi from './components/StoricoProgressi';
import SchedaAllenamento from './components/SchedaAllenamento';

import './App.css';

// Tema Material Design 3
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750a4',
      light: '#9a82db',
      dark: '#4f378b',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#625b71',
      light: '#8b8499',
      dark: '#463d4a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fffbfe',
      paper: '#ffffff',
    },
    surface: {
      main: '#fef7ff',
      variant: '#e7e0ec',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#6750a4',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#ffffff',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workout-tabpanel-${index}`}
      aria-labelledby={`workout-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const tabs = [
    {
      label: 'Database Esercizi',
      icon: <ExerciseIcon />,
      component: <DatabaseEsercizi />
    },
    {
      label: 'Storico e Progressi',
      icon: <HistoryIcon />,
      component: <StoricoProgressi />
    },
    {
      label: 'Scheda Allenamento',
      icon: <WorkoutIcon />,
      component: <SchedaAllenamento />
    }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: 'background.default' }}>
        {/* Header con menu di navigazione */}
        <AppBar position="sticky" elevation={0}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ 
                flexGrow: 1, 
                fontWeight: 600,
                color: 'white'
              }}
            >
              Gestione Allenamenti
            </Typography>
          </Toolbar>
          
          {/* Tabs di navigazione */}
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              backgroundColor: 'primary.main',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: 'white',
                },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{
                  '& .MuiSvgIcon-root': {
                    marginRight: 1,
                    fontSize: '1.2rem',
                  },
                }}
              />
            ))}
          </Tabs>
        </AppBar>

        {/* Contenuto principale */}
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={currentTab} index={index}>
              <Paper
                elevation={1}
                sx={{
                  minHeight: 'calc(100vh - 200px)',
                  p: { xs: 2, sm: 3 },
                  backgroundColor: 'background.paper',
                }}
              >
                {tab.component}
              </Paper>
            </TabPanel>
          ))}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

