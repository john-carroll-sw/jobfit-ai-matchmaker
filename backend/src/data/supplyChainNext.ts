// Next-generation supply chain data model for enterprise-scale simulation
// Inspired by StateIdeas.md, Rewards.md, and Rewards system requirements

export type NodeType = 'factory' | 'distribution_center' | 'retail';

export interface SKU {
  id: string;
  name: string;
  price: number;
  costToProduce: number;
}

export interface InventoryRecord {
  skuId: string;
  quantity: number;
  minInventory?: number;
  maxInventory?: number;
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

export interface SupplyChainState {
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
  // Add more as needed for assets, ships, planes, etc.
}

// Example: Initial empty state (populate as needed)
export const supplyChainNext: SupplyChainState = {
  id: 'scn-001',
  timestamp: Date.now(),
  skus: [],
  factories: [],
  distributionCenters: [],
  retails: [],
  trucks: [],
  ships: [],
  airplanes: [],
  routes: [],
  orders: [],
  events: [],
};

// Initial demo data for enterprise-scale simulation
export const initialSupplyChainNext: SupplyChainState = {
  id: 'scn-demo-001',
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
        { skuId: 'skuA', quantity: 400 },
        { skuId: 'skuB', quantity: 200 },
        { skuId: 'skuC', quantity: 100 },
      ],
    },
    {
      id: 'dc2',
      name: 'DC Dubai',
      location: { lat: 25.276987, lng: 55.296249 },
      inventory: [
        { skuId: 'skuA', quantity: 300 },
        { skuId: 'skuB', quantity: 250 },
        { skuId: 'skuC', quantity: 150 },
      ],
    },
    {
      id: 'dc3',
      name: 'DC Los Angeles',
      location: { lat: 34.0522, lng: -118.2437 },
      inventory: [
        { skuId: 'skuA', quantity: 350 },
        { skuId: 'skuB', quantity: 300 },
        { skuId: 'skuC', quantity: 200 },
      ],
    },
  ],
  retails: [
    {
      id: 'r1',
      name: 'Retail Berlin',
      location: { lat: 52.52, lng: 13.405 },
      inventory: [
        { skuId: 'skuA', quantity: 50 },
        { skuId: 'skuB', quantity: 20 },
        { skuId: 'skuC', quantity: 10 },
      ],
      demand: { skuA: 30, skuB: 20, skuC: 10 },
    },
    {
      id: 'r2',
      name: 'Retail Paris',
      location: { lat: 48.8566, lng: 2.3522 },
      inventory: [
        { skuId: 'skuA', quantity: 40 },
        { skuId: 'skuB', quantity: 30 },
        { skuId: 'skuC', quantity: 15 },
      ],
      demand: { skuA: 25, skuB: 15, skuC: 10 },
    },
    {
      id: 'r3',
      name: 'Retail Dubai',
      location: { lat: 25.2048, lng: 55.2708 },
      inventory: [
        { skuId: 'skuA', quantity: 60 },
        { skuId: 'skuB', quantity: 25 },
        { skuId: 'skuC', quantity: 20 },
      ],
      demand: { skuA: 20, skuB: 10, skuC: 10 },
    },
    {
      id: 'r4',
      name: 'Retail Los Angeles',
      location: { lat: 34.0522, lng: -118.2437 },
      inventory: [
        { skuId: 'skuA', quantity: 70 },
        { skuId: 'skuB', quantity: 40 },
        { skuId: 'skuC', quantity: 25 },
      ],
      demand: { skuA: 35, skuB: 20, skuC: 15 },
    },
  ],
  trucks: [
    { id: 't1', location: { lat: 51.9225, lng: 4.47917 }, maxLoad: 100, cargo: [], currentDestination: 'r1', status: 'idle' },
    { id: 't2', location: { lat: 25.276987, lng: 55.296249 }, maxLoad: 120, cargo: [], currentDestination: 'r3', status: 'idle' },
    { id: 't3', location: { lat: 34.0522, lng: -118.2437 }, maxLoad: 110, cargo: [], currentDestination: 'r4', status: 'idle' },
  ],
  ships: [
    { id: 's1', location: { lat: 30.5852, lng: 32.2654 }, maxLoad: 1000, cargo: [], currentDestination: 'dc1', status: 'idle' }, // Suez Canal
    { id: 's2', location: { lat: 1.3521, lng: 103.8198 }, maxLoad: 1200, cargo: [], currentDestination: 'dc2', status: 'idle' }, // Singapore
  ],
  airplanes: [
    { id: 'a1', location: { lat: 41.9786, lng: -87.9048 }, maxLoad: 200, cargo: [], currentDestination: 'dc3', status: 'idle' }, // Chicago O'Hare
    { id: 'a2', location: { lat: 25.2532, lng: 55.3657 }, maxLoad: 220, cargo: [], currentDestination: 'dc2', status: 'idle' }, // Dubai Intl
  ],
  routes: [
    { id: 'r-f1-dc1', from: 'f1', to: 'dc1', distance: 20000, expectedTravelTime: 10, cost: 5000, status: 'open' },
    { id: 'r-f2-dc3', from: 'f2', to: 'dc3', distance: 3000, expectedTravelTime: 2, cost: 1000, status: 'open' },
    { id: 'r-dc1-r1', from: 'dc1', to: 'r1', distance: 800, expectedTravelTime: 1, cost: 200, status: 'open' },
    { id: 'r-dc1-r2', from: 'dc1', to: 'r2', distance: 900, expectedTravelTime: 1, cost: 220, status: 'open' },
    { id: 'r-dc2-r3', from: 'dc2', to: 'r3', distance: 20, expectedTravelTime: 0.1, cost: 50, status: 'open' },
    { id: 'r-dc3-r4', from: 'dc3', to: 'r4', distance: 30, expectedTravelTime: 0.2, cost: 60, status: 'open' },
    { id: 'r-dc2-dc1', from: 'dc2', to: 'dc1', distance: 6000, expectedTravelTime: 4, cost: 1500, status: 'open' },
    { id: 'r-dc3-dc2', from: 'dc3', to: 'dc2', distance: 13000, expectedTravelTime: 7, cost: 3000, status: 'open' },
    // Air routes
    { id: 'a-f2-dc1', from: 'f2', to: 'dc1', distance: 7000, expectedTravelTime: 0.5, cost: 2000, status: 'open' },
    { id: 'a-f1-dc2', from: 'f1', to: 'dc2', distance: 6500, expectedTravelTime: 0.5, cost: 1800, status: 'open' },
    // Sea routes
    { id: 's-f1-dc1', from: 'f1', to: 'dc1', distance: 20000, expectedTravelTime: 8, cost: 4000, status: 'open' },
    { id: 's-f1-dc2', from: 'f1', to: 'dc2', distance: 18000, expectedTravelTime: 7, cost: 3500, status: 'open' },
  ],
  orders: [
    { id: 'o1', from: 'dc1', to: 'r1', skuId: 'skuA', quantity: 30, dueTime: Date.now() + 3600 * 1000 },
    { id: 'o2', from: 'dc2', to: 'r3', skuId: 'skuB', quantity: 20, dueTime: Date.now() + 7200 * 1000 },
    { id: 'o3', from: 'dc3', to: 'r4', skuId: 'skuC', quantity: 25, dueTime: Date.now() + 5400 * 1000 },
  ],
  events: [
    { id: 'e1', type: 'shipment', timestamp: Date.now(), details: { from: 'dc1', to: 'r1', skuId: 'skuA', quantity: 30 } },
    { id: 'e2', type: 'stockout', timestamp: Date.now(), details: { nodeId: 'r2', skuId: 'skuB' } },
  ],
};
