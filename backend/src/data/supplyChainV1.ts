// V1 Supply Chain State: superset of supplyChainNext, with all fields needed for reward system and optimization
// Combines structure from supplyChainNext and V1-specific fields (see Rewards.md, StateIdeas.md)

export type NodeType = 'factory' | 'distribution_center' | 'retail';

export interface SKU {
  id: string;
  name: string;
  price: number; // revenue per unit
  costToProduce: number; // cost to produce
}

export interface InventoryRecord {
  skuId: string;
  quantity: number;
  minInventory?: number; // V1: for DC/retail
  maxInventory?: number; // V1: for DC/retail
}

export interface Factory {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  productionRates: Record<string, number>; // skuId -> units per time unit
  productionTimes: Record<string, number>; // skuId -> time to produce one unit
  inventory: InventoryRecord[];
}

export interface DistributionCenter {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  inventory: InventoryRecord[];
}

export interface Retail {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  inventory: InventoryRecord[];
  demand: Record<string, number>; // skuId -> demand per time unit
}

export interface Truck {
  id: string;
  location: { lat: number; lng: number };
  maxLoad: number;
  cargo: InventoryRecord[];
  currentDestination?: string; // node id
  status: 'idle' | 'enroute' | 'loading' | 'unloading';
}

export interface Ship {
  id: string;
  location: { lat: number; lng: number };
  maxLoad: number;
  cargo: InventoryRecord[];
  currentDestination?: string; // node id or port
  status: 'idle' | 'enroute' | 'loading' | 'unloading';
}

export interface Airplane {
  id: string;
  location: { lat: number; lng: number };
  maxLoad: number;
  cargo: InventoryRecord[];
  currentDestination?: string; // node id or airport
  status: 'idle' | 'enroute' | 'loading' | 'unloading';
}

export interface Route {
  id: string;
  from: string; // node id
  to: string;   // node id
  distance: number; // in km
  expectedTravelTime: number; // in time units
  cost: number; // per trip
  status: 'open' | 'closed' | 'delayed';
  risk?: number; // 0-1 risk factor
  mode?: 'truck' | 'ship' | 'air'; // V1: explicit mode for reward system
}

export interface Order {
  id: string;
  from: string; // node id
  to: string;   // node id
  skuId: string;
  quantity: number;
  dueTime: number; // timestamp or time unit
}

export interface SupplyChainEvent {
  id: string;
  type: 'stockout' | 'route_closed' | 'bridge_closed' | 'order' | 'production' | 'shipment' | 'custom';
  timestamp: number;
  details: Record<string, any>;
}

export interface SupplyChainStateV1 {
  id: string;
  timestamp: number;
  skus: SKU[];
  factories: Factory[];
  distributionCenters: DistributionCenter[];
  retails: Retail[];
  trucks: Truck[];
  ships: Ship[];
  airplanes: Airplane[];
  routes: Route[];
  orders: Order[];
  events: SupplyChainEvent[];
}

// Example: Initial V1 state (demo data, extensible for reward system)
export const supplyChainV1: SupplyChainStateV1 = {
  id: 'scv1-demo-001',
  timestamp: Date.now(),
  skus: [
    { id: 'skuA', name: 'Widget A', price: 100, costToProduce: 60 },
    { id: 'skuB', name: 'Widget B', price: 150, costToProduce: 90 },
    { id: 'skuC', name: 'Widget C', price: 200, costToProduce: 120 },
  ],
  factories: [
    {
      id: 'f1',
      name: 'Factory Shanghai',
      location: { lat: 31.2304, lng: 121.4737 },
      productionRates: { skuA: 100, skuB: 80, skuC: 60 },
      productionTimes: { skuA: 1, skuB: 1, skuC: 2 },
      inventory: [
        { skuId: 'skuA', quantity: 1000 },
        { skuId: 'skuB', quantity: 800 },
        { skuId: 'skuC', quantity: 600 },
      ],
    },
    {
      id: 'f2',
      name: 'Factory Chicago',
      location: { lat: 41.8781, lng: -87.6298 },
      productionRates: { skuA: 80, skuB: 100, skuC: 70 },
      productionTimes: { skuA: 1, skuB: 1, skuC: 2 },
      inventory: [
        { skuId: 'skuA', quantity: 900 },
        { skuId: 'skuB', quantity: 900 },
        { skuId: 'skuC', quantity: 700 },
      ],
    },
  ],
  distributionCenters: [
    {
      id: 'dc1',
      name: 'DC Rotterdam',
      location: { lat: 51.9225, lng: 4.47917 },
      inventory: [
        { skuId: 'skuA', quantity: 400, minInventory: 100, maxInventory: 1000 },
        { skuId: 'skuB', quantity: 200, minInventory: 50, maxInventory: 500 },
        { skuId: 'skuC', quantity: 100, minInventory: 20, maxInventory: 200 },
      ],
    },
    {
      id: 'dc2',
      name: 'DC Dubai',
      location: { lat: 25.276987, lng: 55.296249 },
      inventory: [
        { skuId: 'skuA', quantity: 300, minInventory: 80, maxInventory: 800 },
        { skuId: 'skuB', quantity: 250, minInventory: 60, maxInventory: 600 },
        { skuId: 'skuC', quantity: 150, minInventory: 30, maxInventory: 300 },
      ],
    },
    {
      id: 'dc3',
      name: 'DC Los Angeles',
      location: { lat: 34.0522, lng: -118.2437 },
      inventory: [
        { skuId: 'skuA', quantity: 350, minInventory: 90, maxInventory: 900 },
        { skuId: 'skuB', quantity: 300, minInventory: 70, maxInventory: 700 },
        { skuId: 'skuC', quantity: 200, minInventory: 40, maxInventory: 400 },
      ],
    },
  ],
  retails: [
    {
      id: 'r1',
      name: 'Retail Berlin',
      location: { lat: 52.52, lng: 13.405 },
      inventory: [
        { skuId: 'skuA', quantity: 50, minInventory: 10, maxInventory: 100 },
        { skuId: 'skuB', quantity: 20, minInventory: 10, maxInventory: 50 },
        { skuId: 'skuC', quantity: 10, minInventory: 5, maxInventory: 30 },
      ],
      demand: { skuA: 30, skuB: 20, skuC: 10 },
    },
    {
      id: 'r2',
      name: 'Retail Paris',
      location: { lat: 48.8566, lng: 2.3522 },
      inventory: [
        { skuId: 'skuA', quantity: 40, minInventory: 10, maxInventory: 100 },
        { skuId: 'skuB', quantity: 30, minInventory: 10, maxInventory: 50 },
        { skuId: 'skuC', quantity: 15, minInventory: 5, maxInventory: 30 },
      ],
      demand: { skuA: 25, skuB: 15, skuC: 10 },
    },
    {
      id: 'r3',
      name: 'Retail Dubai',
      location: { lat: 25.2048, lng: 55.2708 },
      inventory: [
        { skuId: 'skuA', quantity: 60, minInventory: 10, maxInventory: 100 },
        { skuId: 'skuB', quantity: 25, minInventory: 10, maxInventory: 50 },
        { skuId: 'skuC', quantity: 20, minInventory: 5, maxInventory: 30 },
      ],
      demand: { skuA: 20, skuB: 10, skuC: 10 },
    },
    {
      id: 'r4',
      name: 'Retail Los Angeles',
      location: { lat: 34.0522, lng: -118.2437 },
      inventory: [
        { skuId: 'skuA', quantity: 70, minInventory: 10, maxInventory: 100 },
        { skuId: 'skuB', quantity: 40, minInventory: 10, maxInventory: 50 },
        { skuId: 'skuC', quantity: 25, minInventory: 5, maxInventory: 30 },
      ],
      demand: { skuA: 35, skuB: 20, skuC: 15 },
    },
  ],
  trucks: [
    { id: 't1', location: { lat: 51.9225, lng: 4.47917 }, maxLoad: 100, cargo: [], currentDestination: 'r1', status: 'idle' },
  ],
  ships: [
    { id: 's1', location: { lat: 30.5852, lng: 32.2654 }, maxLoad: 1000, cargo: [], currentDestination: 'dc1', status: 'idle' },
  ],
  airplanes: [
    { id: 'a1', location: { lat: 41.9786, lng: -87.9048 }, maxLoad: 200, cargo: [], currentDestination: 'dc1', status: 'idle' },
    { id: 'a2', location: { lat: 25.2532, lng: 55.3657 }, maxLoad: 220, cargo: [], currentDestination: 'dc2', status: 'idle' },
    { id: 'a3', location: { lat: 48.3538, lng: 11.7861 }, maxLoad: 210, cargo: [], currentDestination: 'dc1', status: 'idle' }, // Munich
    { id: 'a4', location: { lat: 35.5494, lng: 139.7798 }, maxLoad: 230, cargo: [], currentDestination: 'dc1', status: 'idle' }, // Tokyo Haneda
    { id: 'a5', location: { lat: 33.9425, lng: -118.4081 }, maxLoad: 250, cargo: [], currentDestination: 'dc1', status: 'idle' }, // LAX
  ],
  routes: [
    // Factory to DC
    { id: 'r-f1-dc1', from: 'f1', to: 'dc1', distance: 20000, expectedTravelTime: 10, cost: 5000, status: 'open', risk: 0.1, mode: 'ship' },
    { id: 'r-f1-dc2', from: 'f1', to: 'dc2', distance: 18000, expectedTravelTime: 9, cost: 4800, status: 'open', risk: 0.12, mode: 'ship' },
    { id: 'r-f1-dc3', from: 'f1', to: 'dc3', distance: 10000, expectedTravelTime: 6, cost: 3000, status: 'open', risk: 0.09, mode: 'air' },
    { id: 'r-f2-dc1', from: 'f2', to: 'dc1', distance: 7000, expectedTravelTime: 2, cost: 2000, status: 'open', risk: 0.08, mode: 'air' },
    { id: 'r-f2-dc2', from: 'f2', to: 'dc2', distance: 11000, expectedTravelTime: 5, cost: 2500, status: 'open', risk: 0.11, mode: 'ship' },
    { id: 'r-f2-dc3', from: 'f2', to: 'dc3', distance: 3000, expectedTravelTime: 1, cost: 1000, status: 'open', risk: 0.07, mode: 'truck' },
    // DC to Retail
    { id: 'r-dc1-r1', from: 'dc1', to: 'r1', distance: 800, expectedTravelTime: 1, cost: 200, status: 'open', risk: 0.05, mode: 'truck' },
    { id: 'r-dc1-r2', from: 'dc1', to: 'r2', distance: 900, expectedTravelTime: 1, cost: 220, status: 'open', risk: 0.06, mode: 'truck' },
    { id: 'r-dc2-r3', from: 'dc2', to: 'r3', distance: 20, expectedTravelTime: 0.1, cost: 50, status: 'open', risk: 0.03, mode: 'truck' },
    { id: 'r-dc3-r4', from: 'dc3', to: 'r4', distance: 30, expectedTravelTime: 0.2, cost: 60, status: 'open', risk: 0.04, mode: 'truck' },
    { id: 'r-dc2-r4', from: 'dc2', to: 'r4', distance: 1200, expectedTravelTime: 2, cost: 300, status: 'open', risk: 0.09, mode: 'air' },
    { id: 'r-dc3-r1', from: 'dc3', to: 'r1', distance: 950, expectedTravelTime: 1.2, cost: 250, status: 'open', risk: 0.07, mode: 'truck' },
    // Cross-DC
    { id: 'r-dc1-dc2', from: 'dc1', to: 'dc2', distance: 6000, expectedTravelTime: 4, cost: 1500, status: 'open', risk: 0.13, mode: 'ship' },
    { id: 'r-dc2-dc3', from: 'dc2', to: 'dc3', distance: 13000, expectedTravelTime: 7, cost: 3000, status: 'open', risk: 0.15, mode: 'ship' },
    { id: 'r-dc3-dc1', from: 'dc3', to: 'dc1', distance: 8000, expectedTravelTime: 3, cost: 1800, status: 'open', risk: 0.1, mode: 'truck' },
    // Direct Factory to Retail (express air)
    { id: 'r-f1-r4', from: 'f1', to: 'r4', distance: 12000, expectedTravelTime: 5, cost: 3500, status: 'open', risk: 0.14, mode: 'air' },
    { id: 'r-f2-r1', from: 'f2', to: 'r1', distance: 8000, expectedTravelTime: 3, cost: 2200, status: 'open', risk: 0.12, mode: 'air' },
  ],
  orders: [
    { id: 'o1', from: 'dc1', to: 'r1', skuId: 'skuA', quantity: 30, dueTime: Date.now() + 3600 * 1000 },
  ],
  events: [
    { id: 'e1', type: 'shipment', timestamp: Date.now(), details: { from: 'dc1', to: 'r1', skuId: 'skuA', quantity: 30 } },
  ],
};
