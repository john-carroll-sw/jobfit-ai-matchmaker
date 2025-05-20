import React, { useState, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { createTheme, type Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeContext } from './ThemeContextDefinition';

// Base theme settings that are common between light and dark modes
const baseThemeSettings = {
  typography: {
    fontFamily: [
      "Space Grotesk",
      "Sora",
      "IBM Plex Sans",
      "Inter",
      "Roboto",
      "Arial",
      "sans-serif"
    ].join(","),
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: "#5D5FEF",
        },
      },
    },
  },
};

// Dark theme palette
const darkPalette = {
  mode: 'dark' as const,
  background: {
    default: "#16181D",
    paper: "#1E222A",
  },
  primary: {
    main: "#5D5FEF", // Slightly less saturated blue
  },
  secondary: {
    main: "#3DD598", // Less saturated green
  },
  text: {
    primary: "#F1F3F5", // Slightly off-white for less eye strain
    secondary: "#BEC2C8", // Lighter secondary text
  },
  error: {
    main: "#FF6B6B",  // Less harsh red
  },
};

// Light theme palette - adjusted for light mode
const lightPalette = {
  mode: 'light' as const,
  background: {
    default: "#F8F9FA",
    paper: "#FFFFFF",
  },
  primary: {
    main: "#5D5FEF", // Keep the same primary color for brand consistency
  },
  secondary: {
    main: "#3DD598", // Keep the same secondary color for brand consistency
  },
  text: {
    primary: "#1E222A", // Dark text for light mode
    secondary: "#4D5C6F", // Medium dark for secondary text
  },
  error: {
    main: "#E53935", // Standard error red for light mode
  },
};

// Theme-specific component overrides
const getDarkComponentOverrides = () => ({
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "linear-gradient(135deg, #1E222A 60%, #232A35 100%)",
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)",
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      valueLabel: {
        background: "#5D5FEF",
      },
      thumb: {
        boxShadow: "0 0 0 8px rgba(93, 95, 239, 0.16)",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        background: "rgba(30, 34, 42, 0.7)",
      },
    },
  },
});

const getLightComponentOverrides = () => ({
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "linear-gradient(135deg, #FFFFFF 60%, #F0F2F5 100%)",
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.05)",
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      valueLabel: {
        background: "#5D5FEF",
      },
      thumb: {
        boxShadow: "0 0 0 8px rgba(93, 95, 239, 0.12)",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        background: "rgba(255, 255, 255, 0.85)",
      },
    },
  },
});

// Create theme function that takes a mode parameter
const createAppTheme = (mode: 'light' | 'dark'): Theme => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  const componentOverrides = mode === 'dark' ? 
    getDarkComponentOverrides() : 
    getLightComponentOverrides();

  return createTheme({
    palette,
    ...baseThemeSettings,
    components: {
      ...baseThemeSettings.components,
      ...componentOverrides,
    } as unknown as Theme['components'],
  });
};

// ThemeProvider component that provides the theme context
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize the theme to prevent unnecessary re-renders
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline /> {/* This normalizes styles across browsers */}
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
