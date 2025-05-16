import React, { useState, useEffect } from "react";
import { 
  Paper, Typography, FormControl, InputLabel, MenuItem,
  Select, Button, Box, FormHelperText, CircularProgress,
  Alert, Snackbar
} from "@mui/material";
import type { DisruptionRequest, ReasoningResponse } from "../types/supplyChain";
import { triggerDisruption, getReasoning, resetSupplyChain as resetSupplyChainApi } from "../api/supplyChainApi";
import { useSupplyChain } from "../hooks/useSupplyChain";

interface ControlsPanelProps {
  onReasoningResult?: (result: ReasoningResponse | undefined) => void;
  onStateChange?: () => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ onReasoningResult, onStateChange }) => {
  const { supplyChain, refreshSupplyChain } = useSupplyChain();
  const [disruptionType, setDisruptionType] = useState<string>("");
  const [nodeId, setNodeId] = useState<string>("");
  const [routeId, setRouteId] = useState<string>("");
  const [sku, setSku] = useState<string>(""); // Changed from "skuA" to empty string
  const [bridgeId, setBridgeId] = useState<string>("");
  const [optimizationPriority, setOptimizationPriority] = useState<string>("cost");
  const [loading, setLoading] = useState<boolean>(false);
  const [reasoningLoading, setReasoningLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, severity: "success" | "error"}>({
    open: false,
    message: "",
    severity: "success"
  });

  // Reset secondary fields when disruption type changes
  useEffect(() => {
    if (disruptionType === "stockout") {
      setRouteId("");
      setBridgeId("");
    } else if (disruptionType === "route_closed") {
      setNodeId("");
      setSku("");
      setBridgeId("");
    } else if (disruptionType === "bridge_closed") {
      setNodeId("");
      setSku("");
      setRouteId("");
    }
  }, [disruptionType]);

  // Compute available SKUs for the selected node
  const availableSkus = React.useMemo(() => {
    if (disruptionType === "stockout" && nodeId && supplyChain) {
      const node = supplyChain.nodes.find((n: import("../types/supplyChain").SupplyChainNode) => n.id === nodeId);
      if (node) {
        return Object.entries(node.inventory)
          // .filter(([_, qty]) => qty > 0)
          .filter(([, inventoryRecord]) => inventoryRecord.quantity > 0)
          .map(([key]) => key);
      }
    }
    return [];
  }, [disruptionType, nodeId, supplyChain]);

  // Ensure SKU value is always valid for Select
  useEffect(() => {
    if (disruptionType === "stockout") {
      if (availableSkus.length === 0) {
        setSku("");
      } else if (!availableSkus.includes(sku)) {
        setSku(availableSkus[0]);
      }
    }
  }, [disruptionType, nodeId, availableSkus, sku]);

  const handleTriggerDisruption = async () => {
    if (!disruptionType) {
      setSnackbar({
        open: true,
        message: "Please select a disruption type",
        severity: "error"
      });
      return;
    }

    const disruption: DisruptionRequest = {
      type: disruptionType as "stockout" | "route_closed" | "bridge_closed",
      nodeId: disruptionType === "stockout" ? nodeId : undefined,
      sku: disruptionType === "stockout" ? sku : undefined,
      routeId: disruptionType === "route_closed" ? routeId : undefined,
      bridgeId: disruptionType === "bridge_closed" ? bridgeId : undefined,
    };

    try {
      setLoading(true);
      const result = await triggerDisruption(disruption);
      setSnackbar({
        open: true,
        message: result.message || "Disruption triggered successfully",
        severity: "success"
      });
      
      // Refresh supply chain state via context
      await refreshSupplyChain();
      if (onStateChange) onStateChange();
    } catch (error) {
      console.error("Error triggering disruption:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to trigger disruption",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetReasoning = async () => {
    if (!disruptionType) {
      setSnackbar({
        open: true,
        message: "Please select a disruption type",
        severity: "error"
      });
      return;
    }

    try {
      setReasoningLoading(true);
      const details: Record<string, string | number | undefined> = {};
      
      if (disruptionType === "stockout") {
        details.nodeId = nodeId;
        details.sku = sku;
      } else if (disruptionType === "route_closed") {
        details.routeId = routeId;
      } else if (disruptionType === "bridge_closed") {
        details.bridgeId = bridgeId;
      }

      const result = await getReasoning({
        disruptionType,
        details,
        optimizationPriority
      });

      // Pass reasoning result to parent component
      if (onReasoningResult) {
        onReasoningResult(result.data);
      }

      setSnackbar({
        open: true,
        message: "AI reasoning generated successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error getting reasoning:", error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : "Failed to generate AI reasoning",
        severity: "error"
      });
    } finally {
      setReasoningLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await resetSupplyChainApi();
      setSnackbar({
        open: true,
        message: "Demo state reset to initial values.",
        severity: "success"
      });
      await refreshSupplyChain();
      if (onStateChange) onStateChange();
      // Optionally, also clear reasoning panel
      if (onReasoningResult) onReasoningResult(undefined);
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to reset demo state.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Simulate disruptions and get AI reasoning
      </Typography>
      <FormControl fullWidth margin="normal">
        <InputLabel>Optimization Priority</InputLabel>
        <Select
          value={optimizationPriority}
          onChange={(e) => setOptimizationPriority(e.target.value)}
          label="Optimization Priority"
        >
          <MenuItem value="cost">Cost Efficiency</MenuItem>
          <MenuItem value="time">Time Efficiency</MenuItem>
          <MenuItem value="service">Service Level</MenuItem>
          <MenuItem value="risk">Risk Minimization</MenuItem>
        </Select>
        <FormHelperText>Select what to optimize for in recommendations</FormHelperText>
      </FormControl>
      <FormControl fullWidth margin="normal">
        <InputLabel>Disruption Type</InputLabel>
        <Select
          value={disruptionType}
          onChange={(e) => setDisruptionType(e.target.value)}
          label="Disruption Type"
        >
          <MenuItem value="stockout">Stockout</MenuItem>
          <MenuItem value="route_closed">Route Closed</MenuItem>
          <MenuItem value="bridge_closed">Bridge Closed</MenuItem>
        </Select>
        <FormHelperText>Select the type of disruption to simulate</FormHelperText>
      </FormControl>

      {disruptionType === "stockout" && (
        <>
          <FormControl fullWidth margin="normal">
            <InputLabel>Node</InputLabel>
            <Select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              label="Node"
            >
              {supplyChain?.nodes
                .filter((node: import("../types/supplyChain").SupplyChainNode) => node.type === "retail")
                .map((node: import("../types/supplyChain").SupplyChainNode) => (
                  <MenuItem key={node.id} value={node.id}>
                    {node.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>SKU</InputLabel>
            <Select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              label="SKU"
            >
              {availableSkus.map((key) => (
                <MenuItem key={key} value={key}>
                  {key.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      {disruptionType === "route_closed" && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Route</InputLabel>
          <Select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            label="Route"
          >
            {supplyChain?.routes.map((route: import("../types/supplyChain").SupplyChainRoute) => {
              const fromNode = supplyChain.nodes.find((n: import("../types/supplyChain").SupplyChainNode) => n.id === route.from)?.name;
              const toNode = supplyChain.nodes.find((n: import("../types/supplyChain").SupplyChainNode) => n.id === route.to)?.name;
              return (
                <MenuItem key={route.id} value={route.id}>
                  {fromNode} → {toNode}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}

      {disruptionType === "bridge_closed" && (
        <FormControl fullWidth margin="normal">
          <InputLabel>Bridge</InputLabel>
          <Select
            value={bridgeId}
            onChange={(e) => setBridgeId(e.target.value)}
            label="Bridge"
          >
            <MenuItem value="oakland_bay_bridge">Oakland Bay Bridge</MenuItem>
          </Select>
        </FormControl>
      )}

      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleTriggerDisruption}
          disabled={loading || !disruptionType || (disruptionType === "stockout" && (!nodeId || !sku)) || (disruptionType === "route_closed" && !routeId) || (disruptionType === "bridge_closed" && !bridgeId)}
        >
          {loading ? <CircularProgress size={24} /> : "Trigger Disruption"}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleGetReasoning}
          disabled={reasoningLoading || !disruptionType || (disruptionType === "stockout" && (!nodeId || !sku)) || (disruptionType === "route_closed" && !routeId) || (disruptionType === "bridge_closed" && !bridgeId)}
        >
          {reasoningLoading ? <CircularProgress size={24} /> : "Get AI Reasoning"}
        </Button>
        <Button
          variant="text"
          color="secondary"
          onClick={handleReset}
          disabled={loading || reasoningLoading}
        >
          Reset Demo State
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ControlsPanel;
