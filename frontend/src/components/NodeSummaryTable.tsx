import React from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Typography } from "@mui/material";
import { useSupplyChain } from "../hooks/useSupplyChain";
import type { SupplyChainNode } from "../types/supplyChain";
import type { InventoryRecord } from "../../../backend/src/data/supplyChainV1";

// Type guards
function isFactory(node: SupplyChainNode): node is SupplyChainNode & { productionRates: Record<string, number>; productionTimes: Record<string, number>; inventory: InventoryRecord[] } {
  return node.type === "factory" && Array.isArray(node.inventory) && "productionRates" in node && "productionTimes" in node;
}
function isDistributionCenter(node: SupplyChainNode): node is SupplyChainNode & { inventory: InventoryRecord[] } {
  return node.type === "distribution_center" && Array.isArray(node.inventory);
}
function isRetail(node: SupplyChainNode): node is SupplyChainNode & { demand: Record<string, number>; inventory: InventoryRecord[] } {
  return node.type === "retail" && Array.isArray(node.inventory) && "demand" in node;
}

const NODE_TYPE_EXTRA_COLUMNS = {
  factory: [
    { key: "prod-rate", label: "Production Rate" },
    { key: "prod-time", label: "Production Time" }
  ],
  distribution_center: [
    { key: "min-inv", label: "Min Inv" },
    { key: "max-inv", label: "Max Inv" }
  ],
  retail: [
    { key: "min-inv", label: "Min Inv" },
    { key: "max-inv", label: "Max Inv" },
    { key: "demand", label: "Demand" }
  ]
};

const NodeSummaryTable: React.FC = () => {
  const { supplyChain } = useSupplyChain();
  const nodes = React.useMemo(() => supplyChain?.nodes ?? [], [supplyChain]);
  // Always show these 3 product SKUs
  const skus = ['skuA', 'skuB', 'skuC'];

  // Group nodes by type
  const groupedNodes: Record<string, SupplyChainNode[]> = React.useMemo(() => {
    const groups: Record<string, SupplyChainNode[]> = {};
    nodes.forEach((node) => {
      if (!groups[node.type]) groups[node.type] = [];
      groups[node.type].push(node);
    });
    return groups;
  }, [nodes]);

  // DEBUG: Log node data for each type
  React.useEffect(() => {
    ['factory', 'distribution_center', 'retail'].forEach(type => {
      if (groupedNodes[type]?.length) {
        console.log(`Nodes of type ${type}:`, groupedNodes[type]);
      }
    });
  }, [groupedNodes]);

  const formatNodeType = (type: string): string => {
    switch (type) {
      case "factory":
        return "Factory";
      case "distribution_center":
        return "Distribution Center";
      case "retail":
        return "Retail";
      default:
        return type;
    }
  };

  return (
    <Box>
      <TableContainer component={Paper} sx={{ background: '#23262F', color: '#F4F4F4' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ px: 2, pt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Node Summary
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: '#00FFD0', fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ color: '#00FFD0', fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ color: '#00FFD0', fontWeight: 700 }}>Location</TableCell>
              {skus.map((sku) => (
                <TableCell key={sku} sx={{ color: '#00FFD0', fontWeight: 700 }}>{sku}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(['factory', 'distribution_center', 'retail'] as const).map(type =>
              groupedNodes[type]?.length ? (
                <React.Fragment key={type}>
                  {/* Sub-header for this node type */}
                  <TableRow>
                    <TableCell colSpan={3 + skus.length} sx={{ fontWeight: 'bold', background: '#1A1C23', color: '#00FFD0' }}>
                      {formatNodeType(type)}
                    </TableCell>
                    {NODE_TYPE_EXTRA_COLUMNS[type].map((col) => (
                        <TableCell key={col.key} sx={{ background: '#1A1C23', color: '#00FFD0', fontWeight: 700 }}>{col.label}</TableCell>
                    ))}
                  </TableRow>
                  {/* Rows for this type */}
                  {groupedNodes[type].map(node => (
                    <TableRow key={node.id}>
                      <TableCell sx={{ color: '#F4F4F4' }}>{node.name}</TableCell>
                      <TableCell sx={{ color: '#F4F4F4' }}>{formatNodeType(node.type)}</TableCell>
                      <TableCell sx={{ color: '#F4F4F4' }}>{node.location ? `${node.location.lat.toFixed(2)}, ${node.location.lng.toFixed(2)}` : '-'}</TableCell>
                      {skus.map(sku => (
                        <TableCell key={sku} sx={{ color: '#F4F4F4' }}>
                          {Array.isArray(node.inventory)
                            ? (node.inventory as InventoryRecord[]).find((item: InventoryRecord) => item.skuId === sku)?.quantity ?? 0
                            : (node.inventory as Record<string, number>)[sku] ?? 0}
                        </TableCell>
                      ))}
                      {/* Extra columns for this node type */}
                      {NODE_TYPE_EXTRA_COLUMNS[type].map(col => {
                        if (col.key === 'prod-rate' && isFactory(node)) {
                          return (
                            <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>
                              {skus.map(sku => node.productionRates?.[sku] !== undefined ? `${sku}: ${node.productionRates[sku]}` : null).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                          );
                        }
                        if (col.key === 'prod-time' && isFactory(node)) {
                          return (
                            <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>
                              {skus.map(sku => node.productionTimes?.[sku] !== undefined ? `${sku}: ${node.productionTimes[sku]}` : null).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                          );
                        }
                        if (col.key === 'min-inv' && (isDistributionCenter(node) || isRetail(node))) {
                          return (
                            <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>
                              {skus.map(sku => {
                                const rec = node.inventory.find((item: InventoryRecord) => item.skuId === sku);
                                return rec?.minInventory !== undefined ? `${sku}: ${rec.minInventory}` : null;
                              }).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                          );
                        }
                        if (col.key === 'max-inv' && (isDistributionCenter(node) || isRetail(node))) {
                          return (
                            <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>
                              {skus.map(sku => {
                                const rec = node.inventory.find((item: InventoryRecord) => item.skuId === sku);
                                return rec?.maxInventory !== undefined ? `${sku}: ${rec.maxInventory}` : null;
                              }).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                          );
                        }
                        if (col.key === 'demand' && isRetail(node)) {
                          return (
                            <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>
                              {skus.map(sku => node.demand?.[sku] !== undefined ? `${sku}: ${node.demand?.[sku]}` : null).filter(Boolean).join(', ') || '-'}
                            </TableCell>
                          );
                        }
                        return <TableCell key={col.key} sx={{ color: '#F4F4F4' }}>-</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ) : null
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default NodeSummaryTable;
