import React, { useMemo, useState } from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Box, Chip, TableSortLabel } from "@mui/material";
import { useSupplyChain } from "../hooks/useSupplyChain";
import type { SupplyChainState } from "../types/supplyChain";

// Backend disruption type
interface DisruptionBackend {
  type: string;
  nodeId?: string;
  nodeName?: string;
  sku?: string;
  routeId?: string;
  from?: string;
  to?: string;
  bridgeId?: string;
}

interface Disruption {
  type: string;
  node?: string;
  sku?: string;
  details?: string;
  routeId?: string;
  from?: string;
  to?: string;
  bridgeId?: string;
  nodeId?: string;
  nodeName?: string;
}

const DisruptionsTable: React.FC = () => {
  const { supplyChain } = useSupplyChain();
  const [sortBy, setSortBy] = useState<keyof Disruption>('type');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Map backend disruptions to frontend disruptions
  const disruptions: Disruption[] = useMemo(() => {
    const disruptionsBackend = (supplyChain as SupplyChainState & { disruptions?: DisruptionBackend[] })?.disruptions || [];
    return disruptionsBackend.map((d) => {
      if (d.type === 'stockout') {
        return {
          type: 'Stockout',
          node: d.nodeName || d.nodeId,
          sku: d.sku,
          details: `No inventory for ${d.sku} at ${d.nodeName || d.nodeId}`
        };
      }
      if (d.type === 'route_closed') {
        return {
          type: 'Route Closed',
          node: `${d.from} → ${d.to}`,
          sku: '-',
          details: `Route from ${d.from} to ${d.to} is closed`
        };
      }
      if (d.type === 'bridge_closed') {
        let bridgeName = d.bridgeId;
        if (d.bridgeId === "oakland_bay_bridge") bridgeName = "Oakland Bay Bridge";
        return {
          type: 'Bridge Closed',
          node: bridgeName,
          sku: '-',
          details: `${bridgeName} is closed, routes will be redirected`
        };
      }
      // fallback for unknown types
      return {
        type: d.type,
        node: d.nodeName || d.nodeId || d.routeId || d.bridgeId || '-',
        sku: d.sku || '-',
        details: JSON.stringify(d)
      };
    });
  }, [supplyChain]);

  // Sort disruptions
  const sortedDisruptions = useMemo(() => {
    const arr = [...disruptions];
    const dir = sortDirection === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      if ((a[sortBy] || '') < (b[sortBy] || '')) return -1 * dir;
      if ((a[sortBy] || '') > (b[sortBy] || '')) return 1 * dir;
      return 0;
    });
    return arr;
  }, [disruptions, sortBy, sortDirection]);

  const handleSort = (column: keyof Disruption) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ background: '#23262F', color: '#F4F4F4' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Active Disruptions
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#FF61A6', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortBy === 'type'}
                  direction={sortBy === 'type' ? sortDirection : 'asc'}
                  onClick={() => handleSort('type')}
                >Type</TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#FF61A6', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortBy === 'node'}
                  direction={sortBy === 'node' ? sortDirection : 'asc'}
                  onClick={() => handleSort('node')}
                >Node/Route</TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#FF61A6', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortBy === 'sku'}
                  direction={sortBy === 'sku' ? sortDirection : 'asc'}
                  onClick={() => handleSort('sku')}
                >SKU</TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: '#FF61A6', fontWeight: 700 }}>
                <TableSortLabel
                  active={sortBy === 'details'}
                  direction={sortBy === 'details' ? sortDirection : 'asc'}
                  onClick={() => handleSort('details')}
                >Details</TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedDisruptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ color: '#B0B3B8', fontStyle: 'italic' }}>
                  No active disruptions.
                </TableCell>
              </TableRow>
            ) : (
              sortedDisruptions.map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Chip label={d.type} color={d.type === "Stockout" ? "secondary" : d.type === "Bridge Closed" ? "warning" : "primary"} size="small" />
                  </TableCell>
                  <TableCell sx={{ color: '#F4F4F4' }}>{d.node}</TableCell>
                  <TableCell sx={{ color: '#F4F4F4' }}>{d.sku}</TableCell>
                  <TableCell sx={{ color: '#F4F4F4' }}>{d.details}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DisruptionsTable;
