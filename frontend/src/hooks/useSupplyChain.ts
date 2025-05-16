import { useContext } from "react";
import { SupplyChainContext } from "../contexts/SupplyChainContext";

/**
 * Hook to access the supply chain context from any component
 * @returns Context containing supplyChain, isInitialState, and functions to refresh/update the state
 */
export const useSupplyChain = () => {
  const context = useContext(SupplyChainContext);
  if (!context) throw new Error("useSupplyChain must be used within a SupplyChainProvider");
  return context;
};