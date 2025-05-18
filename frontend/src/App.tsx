import React from "react";
import { CssBaseline, Container, Box, Typography, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme";

const App: React.FC = () => {
  
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          width: "100vw",
          background: "linear-gradient(120deg, #181A20 0%, #23262F 100%)",
          fontFamily: muiTheme.typography.fontFamily,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            height: "calc(100vh - 10px)",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            m: 0,
            p: 2,
            // pt: 0,
            // pb: 0,
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: "primary.main", mb: 2 }}>
            Jobfit AI Matchmaker
          </Typography>
          <Box sx={{ display: "flex", flexGrow: 1, gap: 2, overflow: "hidden" }}>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
