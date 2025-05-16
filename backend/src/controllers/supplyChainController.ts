import { Request, Response } from 'express';
import { isEqual } from 'lodash';
import { supplyChainV1, SupplyChainStateV1, Factory, DistributionCenter, Retail, Route, InventoryRecord } from '../data/supplyChainV1';

// Store the initial state immediately when this module is loaded
const initialSupplyChain: SupplyChainStateV1 = JSON.parse(JSON.stringify(supplyChainV1));

// Create a copy of the supply chain for use in the controller
let currentSupplyChain: SupplyChainStateV1 = JSON.parse(JSON.stringify(supplyChainV1));

// Track closed bridges in memory
let closedBridges: string[] = [];

// Utility: Detect disruptions in the current supply chain state
function detectDisruptions(state: SupplyChainStateV1, closedBridges: string[]): any[] {
  const disruptions: any[] = [];

  // Defensive: default to empty arrays if missing
  const factories = state.factories || [];
  const distributionCenters = state.distributionCenters || [];
  const retails = state.retails || [];
  const routes = state.routes || [];

  // Process all types of nodes for stockouts
  const processInventory = (nodeId: string, nodeName: string, inventory: InventoryRecord[] = []) => {
    inventory.forEach(item => {
      if (item.quantity === 0) {
        disruptions.push({
          type: 'stockout',
          nodeId: nodeId,
          nodeName: nodeName,
          sku: item.skuId
        });
      }
    });
  };

  // Check factories
  factories.forEach((node: Factory) => {
    processInventory(node.id, node.name, node.inventory);
  });
  // Check distribution centers
  distributionCenters.forEach((node: DistributionCenter) => {
    processInventory(node.id, node.name, node.inventory);
  });
  // Check retail locations
  retails.forEach((node: Retail) => {
    processInventory(node.id, node.name, node.inventory);
  });

  // 1. Retail: Demand exceeds inventory
  retails.forEach((node: Retail) => {
    Object.entries(node.demand || {}).forEach(([sku, demandValue]) => {
      const inv = node.inventory.find(item => item.skuId === sku);
      if (inv && demandValue > inv.quantity) {
        disruptions.push({
          type: 'demand_exceeds_inventory',
          nodeId: node.id,
          nodeName: node.name,
          sku,
          demand: demandValue,
          inventory: inv.quantity
        });
      }
    });
  });

  // 2. Factory: Production rate below total downstream demand
  factories.forEach((factory: Factory) => {
    Object.entries(factory.productionRates || {}).forEach(([sku, rate]) => {
      // Sum demand for this SKU at all retails
      const totalDemand = retails.reduce((sum, r) => sum + (r.demand?.[sku] || 0), 0);
      if (rate < totalDemand) {
        disruptions.push({
          type: 'production_rate_insufficient',
          nodeId: factory.id,
          nodeName: factory.name,
          sku,
          productionRate: rate,
          totalDemand
        });
      }
    });
  });

  // 3. Factory: Production time too high (arbitrary threshold, e.g., > 5 time units)
  const PRODUCTION_TIME_THRESHOLD = 5;
  factories.forEach((factory: Factory) => {
    Object.entries(factory.productionTimes || {}).forEach(([sku, time]) => {
      if (time > PRODUCTION_TIME_THRESHOLD) {
        disruptions.push({
          type: 'production_time_too_high',
          nodeId: factory.id,
          nodeName: factory.name,
          sku,
          productionTime: time,
          threshold: PRODUCTION_TIME_THRESHOLD
        });
      }
    });
  });

  // Closed routes
  routes.forEach((route: Route) => {
    if (route.status === 'closed') {
      disruptions.push({
        type: 'route_closed',
        routeId: route.id,
        from: route.from,
        to: route.to
      });
    }
  });
  // Closed bridges
  (closedBridges || []).forEach(bridgeId => {
    disruptions.push({
      type: 'bridge_closed',
      bridgeId
    });
  });
  return disruptions;
}

// GET /api/supplychain
export const getSupplyChain = (req: Request, res: Response): void => {
  const disruptions = detectDisruptions(currentSupplyChain, closedBridges);

  // Compute flat nodes array for frontend compatibility
  const nodes = [
    ...currentSupplyChain.factories.map(f => ({
      id: f.id,
      name: f.name,
      type: 'factory',
      inventory: f.inventory, // send as array
      location: f.location,
      productionRates: f.productionRates,
      productionTimes: f.productionTimes
    })),
    ...currentSupplyChain.distributionCenters.map(dc => ({
      id: dc.id,
      name: dc.name,
      type: 'distribution_center',
      inventory: dc.inventory, // send as array
      location: dc.location
    })),
    ...currentSupplyChain.retails.map(r => ({
      id: r.id,
      name: r.name,
      type: 'retail',
      inventory: r.inventory, // send as array
      location: r.location,
      demand: r.demand
    }))
  ];

  // Add isInitialState using lodash isEqual for deep comparison
  const isInitialState = isEqual(currentSupplyChain, initialSupplyChain);

  res.json({ ...currentSupplyChain, closedBridges, disruptions, nodes, isInitialState });
};

// POST /api/supplychain/disrupt
// Example body: { type: 'stockout', nodeId: 'r1', sku: 'skuA' } or { type: 'route_closed', routeId: 'r-f1-dc1' } or { type: 'bridge_closed', bridgeId: 'oakland_bay_bridge' }
export const postDisrupt = (req: Request, res: Response): void => {
  const { type, nodeId, sku, routeId, bridgeId } = req.body;
  
  if (type === 'stockout' && nodeId && sku) {
    // Find the node in factories, DCs, or retails
    let nodeFound = false;
    let nodeName = '';
    
    // Check in factories
    const factory = currentSupplyChain.factories.find((n: Factory) => n.id === nodeId);
    if (factory) {
      const inventoryItem = factory.inventory.find(item => item.skuId === sku);
      if (inventoryItem) {
        inventoryItem.quantity = 0;
        nodeFound = true;
        nodeName = factory.name;
      }
    }
    
    // Check in distribution centers if not found
    if (!nodeFound) {
      const dc = currentSupplyChain.distributionCenters.find((n: DistributionCenter) => n.id === nodeId);
      if (dc) {
        const inventoryItem = dc.inventory.find(item => item.skuId === sku);
        if (inventoryItem) {
          inventoryItem.quantity = 0;
          nodeFound = true;
          nodeName = dc.name;
        }
      }
    }
    
    // Check in retails if not found
    if (!nodeFound) {
      const retail = currentSupplyChain.retails.find((n: Retail) => n.id === nodeId);
      if (retail) {
        const inventoryItem = retail.inventory.find(item => item.skuId === sku);
        if (inventoryItem) {
          inventoryItem.quantity = 0;
          nodeFound = true;
          nodeName = retail.name;
        }
      }
    }
    
    if (nodeFound) {
      res.json({ status: 'ok', message: `Stockout triggered for ${sku} at ${nodeName}` });
      return;
    }
    res.status(404).json({ status: 'error', message: 'Node not found' });
    return;
  }
  
  if (type === 'route_closed' && routeId) {
    const route = currentSupplyChain.routes.find((r: Route) => r.id === routeId);
    if (route) {
      route.status = 'closed';
      res.json({ status: 'ok', message: `Route ${routeId} closed` });
      return;
    }
    res.status(404).json({ status: 'error', message: 'Route not found' });
    return;
  }
  
  if (type === 'bridge_closed' && bridgeId) {
    if (!closedBridges.includes(bridgeId)) {
      closedBridges.push(bridgeId);
    }
    res.json({ status: 'ok', message: `Bridge ${bridgeId} closed` });
    return;
  }
  
  res.status(400).json({ status: 'error', message: 'Invalid disruption request' });
};

// POST /api/supplychain/reset
export const resetSupplyChain = (req: Request, res: Response): void => {
  // Reset to the initial state captured when the module was first loaded
  currentSupplyChain = JSON.parse(JSON.stringify(initialSupplyChain));
  closedBridges = [];
  res.json({ status: "ok", message: "Supply chain state reset to initial demo data." });
};

// Export detectDisruptions, closedBridges, and currentSupplyChain for use in other modules
export { detectDisruptions, closedBridges, currentSupplyChain };
