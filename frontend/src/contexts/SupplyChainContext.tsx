import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getSupplyChainState } from "../api/supplyChainApi";
import type { SupplyChainState } from "../types/supplyChain";

// Extend SupplyChainState to include isInitialState from backend
type SupplyChainWithInitial = SupplyChainState & { isInitialState?: boolean };

interface SupplyChainContextType {
  supplyChain: SupplyChainWithInitial | null;
  isInitialState: boolean;
  refreshSupplyChain: () => Promise<void>;
  setSupplyChain: React.Dispatch<React.SetStateAction<SupplyChainWithInitial | null>>;
}

const SupplyChainContext = createContext<SupplyChainContextType | undefined>(undefined);

export const SupplyChainProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [supplyChain, setSupplyChain] = useState<SupplyChainWithInitial | null>(null);
  const [isInitialState, setIsInitialState] = useState(false);

  const refreshSupplyChain = async () => {
    try {
      const data = await getSupplyChainState() as SupplyChainWithInitial;
      setSupplyChain(data);
      setIsInitialState(!!data.isInitialState);
    } catch (error) {
      console.error("Error refreshing supply chain state:", error);
    }
  };

  useEffect(() => {
    refreshSupplyChain();
  }, []);

  return (
    <SupplyChainContext.Provider value={{ supplyChain, isInitialState, refreshSupplyChain, setSupplyChain }}>
      {children}
    </SupplyChainContext.Provider>
  );
};

// Export the context for direct use
export { SupplyChainContext };
