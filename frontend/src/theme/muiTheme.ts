import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
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
  },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "linear-gradient(135deg, #1E222A 60%, #232A35 100%)",
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.25)",
        },
      },
    },
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
    MuiRating: {
      styleOverrides: {
        iconFilled: {
          color: "#5D5FEF",
        },
      },
    },
  },
});
