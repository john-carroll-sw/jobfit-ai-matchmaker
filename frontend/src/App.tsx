import React, { useState, useEffect } from "react";
import { CssBaseline, Container, Box, Paper, Typography, ThemeProvider, IconButton, Collapse } from "@mui/material";
import ControlsPanel from "./components/ControlsPanel";
import ReasoningPanel from "./components/ReasoningPanel";
import NodeSummaryTable from "./components/NodeSummaryTable";
import type { ReasoningResponse } from "./types/supplyChain";
import { muiTheme } from "./theme/muiTheme";
import DisruptionsTable from "./components/DisruptionsTable";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AzureMapView from "./components/AzureMapView";

const App: React.FC = () => {
  const [reasoningResult, setReasoningResult] = useState<ReasoningResponse | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mapPanelHeight, setMapPanelHeight] = useState(window.innerHeight * 0.5); 
  const [isDragging, setIsDragging] = useState(false);
  
  const handleReasoningResult = (result: ReasoningResponse | undefined) => {
    setReasoningResult(result);
  };
  
  const handleStateChange = () => {
    // Trigger a map resize after a short delay to ensure the DOM has updated
    setTimeout(() => {
      if (window.resizeMap) {
        window.resizeMap();
      }
    }, 100);
  };
  
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  // Resize map when mapPanelHeight changes
  useEffect(() => {
    if (window.resizeMap) {
      window.resizeMap();
    }
  }, [mapPanelHeight]);

  React.useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const containerTop = document.getElementById('main-map-container')?.getBoundingClientRect().top || 0;
      const newHeight = e.clientY - containerTop;
      if (newHeight > 100 && newHeight < window.innerHeight - 200) {
        setMapPanelHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
            Supply Chain Reasoning Demo
          </Typography>
          <Box sx={{ display: "flex", flexGrow: 1, gap: 2, overflow: "hidden" }}>
            {/* Sidebar: Controls, AI Analysis and Recommendations */}
            <Box sx={{ display: "flex", flexDirection: "row", transition: "all 0.3s ease" }}>
              <Collapse in={!isSidebarCollapsed} orientation="horizontal">
                <Paper elevation={4} sx={{
                  flex: 1.1,
                  minWidth: isSidebarCollapsed ? 0 : 340,
                  width: isSidebarCollapsed ? 0 : 'auto',
                  maxWidth: '30vw',
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  overflow: "auto",
                  transition: "all 0.3s ease",
                  p: 2,
                  height: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '8px 0 0 8px', // Only left corners rounded
                }}>
                  <ControlsPanel onReasoningResult={handleReasoningResult} onStateChange={handleStateChange} />
                  <ReasoningPanel reasoning={reasoningResult} />
                </Paper>
              </Collapse>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "rgba(35, 38, 47, 0.8)",
                  borderRadius: "0 8px 8px 0",
                  zIndex: 10,
                }}
              >
                <IconButton
                  onClick={() => {
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                    // Trigger map resize after sidebar animation completes
                    setTimeout(() => {
                      if (window.resizeMap) {
                        window.resizeMap();
                      }
                    }, 350);  // slightly longer than the transition duration
                  }}
                  sx={{ color: "white" }}
                >
                  {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
              </Box>
            </Box>
            {/* Main: Map and Tables stacked vertically */}
            <Box sx={{ flex: 2, minWidth: 700, display: "flex", flexDirection: "column", gap: 0, overflow: "auto", height: "100%", minHeight: 0 }}>
              <Paper
                id="main-map-container"
                elevation={4}
                sx={{
                  height: mapPanelHeight,
                  minHeight: 100,
                  maxHeight: '80vh',
                  p: 0,
                  overflow: "hidden",
                  background: "linear-gradient(135deg, #23262F 60%, #23262F 100%)",
                  transition: "height 0.2s",
                  position: "relative",
                  flex: 'none',
                }}
              >
                <AzureMapView />
              </Paper>
              <div className="draggable-divider" onMouseDown={handleMouseDown} />
              <Paper elevation={2} sx={{
                p: 3,
                minHeight: 100,
                height: `calc(100% - ${mapPanelHeight}px - 8px)`,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                transition: "height 0.2s",
                gap: 3,
                flex: 'none',
              }}>
                <NodeSummaryTable />
                <DisruptionsTable />
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
