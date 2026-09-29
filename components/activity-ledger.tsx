"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, EXPLORER_BASE, formatMUSD, getVaultEvents, getVaultForOwner } from "../lib/chain";
import { useWallet } from "./wallet-provider";

type Activity = { name: string; detail: string; block: number; time: number; tx: string };

export function ActivityLedger() {
  const wallet = useWallet();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!wallet.address || !wallet.provider || wallet.chainId !== BSC_TESTNET_CHAIN_ID) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vaultInfo = await getVaultForOwner(wallet.provider, wallet.address);
      if (!vaultInfo) { setItems([]); return; }
      const events = await getVaultEvents(vaultInfo.address, vaultInfo.fromBlock);
      const relevant = events.filter((event) => event.parsed && event.parsed.name !== "ProviderAllowed").slice(0, 20);
      const blocks = await Promise.all([...new Set(relevant.map((event) => event.blockNumber))].map((number) => wallet.provider!.getBlock(number)));
      const timeByBlock = new Map(blocks.filter(Boolean).map((block) => [block!.number, block!.timestamp]));
      setItems(relevant.map((event) => {
        const parsed = event.parsed!;
        const args = parsed.args;
        let detail = "";
        if (parsed.name === "Deposited") detail = `${formatMUSD(BigInt(args.amount ?? args[1]))} mUSD deposited`;
        if (parsed.name === "Withdrawn") detail = `${formatMUSD(BigInt(args.amount ?? args[1]))} mUSD withdrawn`;
        if (parsed.name === "MandateCreated") detail = `Mandate ${String(args.mandateId ?? args[0]).slice(0, 12)}… · ${formatMUSD(BigInt(args.totalLimit ?? args[2]))} mUSD budget`;
        if (parsed.name === "MandateStatusChanged") detail = `Mandate ${String(args.mandateId ?? args[0]).slice(0, 12)}… · released ${formatMUSD(BigInt(args.releasedAmount ?? args[2]))} mUSD`;
        if (parsed.name === "PaymentSettled") detail = `${formatMUSD(BigInt(args.amount ?? args[8]))} mUSD to ${String(args.merchant ?? args[4]).slice(0, 8)}…`;
        return { name: parsed.name, detail, block: event.blockNumber, time: timeByBlock.get(event.blockNumber) ?? 0, tx: event.transactionHash };
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read vault events from BNB Testnet.");
    } finally {
      setLoading(false);
    }
  }, [wallet.address, wallet.chainId, wallet.provider]);

  useEffect(() => { void load(); }, [load, wallet.refreshVersion]);

  return <>
    <div className="page-heading"><div><p className="eyebrow">Activity · BNB Testnet</p><h1>Contract event history.</h1><p>These records are read from your personal vault. Payment events appear only after an on-chain settlement succeeds.</p></div><Link className="button secondary" href="/app">Overview</Link></div>
    {!wallet.address && <section className="state-panel"><p className="eyebrow">Wallet needed</p><h2>Connect to read vault activity.</h2><p>No synthetic receipts or delivery records are displayed.</p><button className="button button-light" onClick={() => void wallet.connect().catch(() => undefined)}>Connect wallet</button></section>}
    {wallet.address && wallet.chainId !== BSC_TESTNET_CHAIN_ID && <section className="state-panel"><p className="eyebrow">Wrong network</p><h2>Switch to BNB Smart Chain Testnet.</h2><button className="button button-light" onClick={() => void wallet.switchToTestnet().catch(() => undefined)}>Switch network</button></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && loading && <section className="state-panel" aria-live="polite"><span className="state-loader" aria-hidden="true"/><p className="eyebrow">Reading BNB Testnet</p><h2>Loading contract events.</h2></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && error && <p className="form-error" role="alert">{error}</p>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && !loading && !error && <section className="activity-section" aria-label="On-chain vault events">
      {items.length === 0 && <div className="empty-record"><p className="eyebrow">No events yet</p><h2>Your vault has no activity records.</h2><p>Deposits, mandate changes, withdrawals, and successful settlements will appear here after chain confirmation.</p></div>}
      {items.map((item) => <div className="activity-row" key={`${item.tx}-${item.name}`}><span className={`status ${item.name === "PaymentSettled" ? "confirmed" : ""}`}>{item.name === "PaymentSettled" ? "Settled" : item.name.replace(/([A-Z])/g, " $1")}</span><div><strong>{item.name.replace(/([A-Z])/g, " $1")}</strong><small>{item.detail} · block {item.block}{item.time ? ` · ${new Date(item.time * 1000).toLocaleString()}` : ""}</small></div><a href={`${EXPLORER_BASE}/tx/${item.tx}`} target="_blank" rel="noreferrer">Transaction ↗</a></div>)}
    </section>}
  </>;
}
