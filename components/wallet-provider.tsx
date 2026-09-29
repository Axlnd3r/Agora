"use client";

import { BrowserProvider, type JsonRpcSigner, type Provider } from "ethers";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BSC_TESTNET_HEX_CHAIN_ID, BSC_TESTNET_RPC, chainReadProvider } from "../lib/chain";

type InjectedEthereum = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
};

declare global {
  interface Window { ethereum?: InjectedEthereum }
}

type WalletState = {
  address: string | null;
  chainId: number | null;
  provider: Provider | null;
  signer: JsonRpcSigner | null;
  refreshVersion: number;
  error: string;
  connect: () => Promise<void>;
  switchToTestnet: () => Promise<void>;
  refresh: () => void;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [error, setError] = useState("");

  const sync = useCallback(async () => {
    const injected = window.ethereum;
    if (!injected) {
      setAddress(null);
      setChainId(null);
      setProvider(null);
      setSigner(null);
      return;
    }

    const [accounts, chainHex] = await Promise.all([
      injected.request({ method: "eth_accounts" }) as Promise<string[]>,
      injected.request({ method: "eth_chainId" }) as Promise<string>,
    ]);
    const nextProvider = new BrowserProvider(injected as never);
    const nextAddress = accounts[0] ?? null;
    setAddress(nextAddress);
    setChainId(Number.parseInt(chainHex, 16));
    setProvider(chainReadProvider);
    setSigner(nextAddress ? await nextProvider.getSigner(nextAddress) : null);
    setError("");
  }, []);

  useEffect(() => {
    void sync().catch((reason: unknown) => setError(messageFor(reason)));
    const injected = window.ethereum;
    if (!injected?.on) return;
    const onAccountsChanged = () => { void sync().catch((reason: unknown) => setError(messageFor(reason))); };
    const onChainChanged = () => { void sync().catch((reason: unknown) => setError(messageFor(reason))); };
    injected.on("accountsChanged", onAccountsChanged);
    injected.on("chainChanged", onChainChanged);
    return () => {
      injected.removeListener?.("accountsChanged", onAccountsChanged);
      injected.removeListener?.("chainChanged", onChainChanged);
    };
  }, [sync]);

  const connect = useCallback(async () => {
    setError("");
    if (!window.ethereum) throw new Error("No browser wallet found. Install or unlock MetaMask, then retry.");
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await sync();
    } catch (reason) {
      const message = messageFor(reason);
      setError(message);
      throw new Error(message);
    }
  }, [sync]);

  const switchToTestnet = useCallback(async () => {
    setError("");
    const injected = window.ethereum;
    if (!injected) throw new Error("No browser wallet found. Install or unlock MetaMask, then retry.");
    try {
      await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_TESTNET_HEX_CHAIN_ID }] });
    } catch (reason) {
      if (typeof reason === "object" && reason !== null && "code" in reason && reason.code === 4902) {
        await injected.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: BSC_TESTNET_HEX_CHAIN_ID,
            chainName: "BNB Smart Chain Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: [BSC_TESTNET_RPC],
            blockExplorerUrls: ["https://testnet.bscscan.com"],
          }],
        });
        await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC_TESTNET_HEX_CHAIN_ID }] });
      } else {
        const message = messageFor(reason);
        setError(message);
        throw new Error(message);
      }
    }
    await sync();
  }, [sync]);

  const value = useMemo<WalletState>(() => ({
    address, chainId, provider, signer, refreshVersion, error,
    connect,
    switchToTestnet,
    refresh: () => setRefreshVersion((current) => current + 1),
  }), [address, chainId, provider, signer, refreshVersion, error, connect, switchToTestnet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}

function messageFor(reason: unknown) {
  if (typeof reason === "object" && reason !== null && "code" in reason && reason.code === 4001) return "The wallet request was rejected.";
  return reason instanceof Error ? reason.message : "Wallet connection failed. Check the wallet and network, then retry.";
}
