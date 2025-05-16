import type {
  SupplyChainState,
  DisruptionRequest,
  ReasoningRequest,
  ReasoningResponse
} from '../types/supplyChain';

const API_BASE = 'http://localhost:4000/api';

/**
 * Fetches the current supply chain state from the backend
 */
export const getSupplyChainState = async (): Promise<SupplyChainState> => {
  const response = await fetch(`${API_BASE}/supplychain`);
  if (!response.ok) {
    throw new Error('Failed to fetch supply chain state');
  }
  return response.json();
};

/**
 * Triggers a disruption in the supply chain
 * @param disruption The disruption to trigger (stockout or route_closed)
 */
export const triggerDisruption = async (disruption: DisruptionRequest): Promise<{ status: string, message: string }> => {
  const response = await fetch(`${API_BASE}/supplychain/disrupt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(disruption),
  });
  if (!response.ok) {
    throw new Error('Failed to trigger disruption');
  }
  return response.json();
};

/**
 * Requests reasoning about a supply chain disruption from the Azure OpenAI backend
 * @param request The reasoning request with disruption type and details
 */
export const getReasoning = async (
  request: ReasoningRequest
): Promise<{ status: string, data: ReasoningResponse }> => {
  const response = await fetch(`${API_BASE}/reason`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Failed to get reasoning');
  }
  return response.json();
};

/**
 * Resets the supply chain state to its initial demo data
 */
export const resetSupplyChain = async (): Promise<{ status: string; message: string }> => {
  const response = await fetch(`${API_BASE}/supplychain/reset`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reset supply chain state');
  }
  return response.json();
};