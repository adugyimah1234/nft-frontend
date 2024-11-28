/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers";
import Provider from 'ethers/providers';
// Type for MetaMask's Ethereum object
export type Ethereum = {
  request: (args: { method: string }) => Promise<string[]>;
  on: (event: string, callback: () => void) => void;
};

// Check if MetaMask is installed
export const getEthereum = (): Ethereum | null => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  console.error("MetaMask is not installed!");
  return null;
};

// Connect to MetaMask and return provider and signer
export const connectMetaMask = async (): Promise<{
  provider: ethers.providers.Provider | null;
  signer: ethers.Signer | null;
} | null> => {
  const ethereum = getEthereum();
  if (ethereum) {
    try {
      // Request account access
      await ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      return { provider, signer };
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      return null;
    }
  }
  return null;
};
