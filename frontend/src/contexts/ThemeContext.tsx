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
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "0.1px",
    },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: "0.1px",
    },
    body1: {
      letterSpacing: "0.1px",
    },
    body2: {
      letterSpacing: "0.1px",
    },
    button: {
      fontWeight: 600,
      letterSpacing: "0.2px",
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
          padding: "8px 16px",
        },
        sizeLarge: {
          padding: "10px 22px",
          fontSize: "1rem",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 6,
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        root: {
          gap: 4,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.75rem",
          padding: "8px 12px",
          borderRadius: 6,
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.15)",
        },
        arrow: {
          color: "currentColor",
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.95rem",
          minHeight: 42,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h4: {
          lineHeight: 1.3,
        },
      },
    },
  },
};

// Dark theme palette with expanded color options
const darkPalette = {
  mode: 'dark' as const,
  background: {
    default: "#16181D",
    paper: "#1E222A",
  },
  primary: {
    main: "#5D5FEF", // Slightly less saturated blue
    light: "#7A7CF8",
    dark: "#4A4BD8",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#3DD598", // Less saturated green
    light: "#65DFAF",
    dark: "#2AAB7B",
    contrastText: "#FFFFFF",
  },
  text: {
    primary: "#F1F3F5", // Slightly off-white for less eye strain
    secondary: "#BEC2C8", // Lighter secondary text
  },
  error: {
    main: "#FF6B6B",  // Less harsh red
    light: "#FF9999",
    dark: "#D64545",
  },
  success: {
    main: "#3DD598", // Match secondary color 
    light: "#65DFAF",
    dark: "#2AAB7B",
  },
  info: {
    main: "#5D5FEF", // Match primary color
    light: "#7A7CF8",
    dark: "#4A4BD8",
  },
  warning: {
    main: "#FFB547", // Warm amber for warnings
    light: "#FFC875",
    dark: "#F29D38",
  },
  divider: "rgba(255, 255, 255, 0.08)",
};

// Light theme palette - adjusted for light mode with improved colors
const lightPalette = {
  mode: 'light' as const,
  background: {
    default: "#FFFFFF", // Pure white background
    paper: "#F8FAFD",   // Very light blue-tinted background for paper elements
  },
  primary: {
    main: "#4A4AF4", // Slightly deeper blue for better contrast in light mode
    light: "#6B6BF8",
    dark: "#3939D0",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#29B77F", // Deeper green for better contrast in light mode
    light: "#3DD598",
    dark: "#219069",
    contrastText: "#FFFFFF",
  },
  text: {
    primary: "#111827", // Very dark gray (almost black) for primary text
    secondary: "#4B5563", // Darker gray for secondary text with better contrast
  },
  error: {
    main: "#E53935", // Standard error red for light mode
    light: "#FF6B6B",
    dark: "#C62828",
  },
  success: {
    main: "#2E7D32", // Deeper green for success messages
    light: "#4CAF50",
    dark: "#1B5E20",
  },
  info: {
    main: "#0288D1", // Nice blue for info messages
    light: "#03A9F4",
    dark: "#01579B",
  },
  warning: {
    main: "#ED6C02", // Warm orange for warnings
    light: "#FF9800",
    dark: "#E65100",
  },
  divider: "rgba(0, 0, 0, 0.12)",
};

// Theme-specific component overrides
const getDarkComponentOverrides = () => ({
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "linear-gradient(135deg, #1E222A 60%, #232A35 100%)",
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)",
        borderColor: "rgba(255,255,255,0.05)",
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
      track: {
        backgroundColor: "#5D5FEF",
      },
      rail: {
        backgroundColor: "rgba(93, 95, 239, 0.25)",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        background: "rgba(30, 34, 42, 0.7)",
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: "rgba(93, 95, 239, 0.08)",
      },
      colorPrimary: {
        backgroundColor: "rgba(93, 95, 239, 0.2)",
        color: "#5D5FEF",
        border: "1px solid rgba(93, 95, 239, 0.3)",
      },
      colorSecondary: {
        backgroundColor: "rgba(61, 213, 152, 0.2)",
        color: "#3DD598",
        border: "1px solid rgba(61, 213, 152, 0.3)",
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        color: "#BEC2C8",
        '&.Mui-checked': {
          color: "#5D5FEF",
        },
      },
      track: {
        backgroundColor: "#4D5C6F",
        '.Mui-checked.Mui-checked + &': {
          backgroundColor: "rgba(93, 95, 239, 0.5)",
        },
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
  MuiDivider: {
    styleOverrides: {
      root: {
        backgroundColor: "rgba(255,255,255,0.08)",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      },
      contained: {
        "&:hover": {
          backgroundColor: "#4a4cd8",
        },
      },
    },
  },
});

const getLightComponentOverrides = () => ({
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: "none",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 10px 0 rgba(0,0,0,0.06)",
        borderColor: "rgba(0,0,0,0.08)",
      },
    },
  },
  MuiSlider: {
    styleOverrides: {
      valueLabel: {
        background: "#4A4AF4",
      },
      thumb: {
        boxShadow: "0 0 0 8px rgba(74, 74, 244, 0.15)",
      },
      track: {
        backgroundColor: "#4A4AF4",
      },
      rail: {
        backgroundColor: "rgba(74, 74, 244, 0.25)",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        background: "#FFFFFF",
        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06)",
        border: "1px solid rgba(226,232,240,0.8)",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        backgroundColor: "rgba(74, 74, 244, 0.1)", 
        border: "1px solid rgba(74, 74, 244, 0.3)",
        color: "#3939D0",
        fontWeight: 500,
      },
      colorPrimary: {
        backgroundColor: "rgba(74, 74, 244, 0.15)",
        color: "#3030C0",
        border: "1px solid rgba(74, 74, 244, 0.4)",
        fontWeight: 600,
      },
      colorSecondary: {
        backgroundColor: "rgba(41, 183, 127, 0.15)",
        color: "#1A8660",
        border: "1px solid rgba(41, 183, 127, 0.4)",
        fontWeight: 600,
      },
      colorSuccess: {
        backgroundColor: "rgba(46, 125, 50, 0.15)",
        color: "#2E7D32",
        fontWeight: 600,
      },
      colorError: {
        backgroundColor: "rgba(211, 47, 47, 0.15)",
        color: "#C62828",
        fontWeight: 600,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        color: "#718096",
        '&.Mui-checked': {
          color: "#4A4AF4",
        },
      },
      track: {
        backgroundColor: "#CBD5E0",
        '.Mui-checked.Mui-checked + &': {
          backgroundColor: "rgba(74, 74, 244, 0.5)",
        },
      },
    },
  },
  MuiRating: {
    styleOverrides: {
      iconFilled: {
        color: "#4A4AF4", // Match the primary color
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        backgroundColor: "rgba(0,0,0,0.08)",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        boxShadow: "0 2px 6px rgba(74, 74, 244, 0.2)",
      },
      contained: {
        backgroundColor: "#4A4AF4",
        "&:hover": {
          backgroundColor: "#3939D0",
        },
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
  const [mode, setMode] = useState<'light' | 'dark'>('light');

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
