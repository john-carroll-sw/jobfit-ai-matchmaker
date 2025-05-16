import { createTheme } from "@mui/material/styles";

export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#181A20",
      paper: "#23262F",
    },
    primary: {
      main: "#00FFD0",
    },
    secondary: {
      main: "#FF61A6",
    },
    text: {
      primary: "#F4F4F4",
      secondary: "#B0B3B8",
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
          backgroundImage: "linear-gradient(135deg, #23262F 60%, #23262F 100%)",
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
  },
});
