"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, EXPLORER_BASE, formatMUSD, getVaultEvents, getVaultForOwner, vaultContract } from "../lib/chain";
import { useWallet } from "./wallet-provider";

type Mandate = {
  id: string;
  agent: string;
  merchant: string;
  serviceId: string;
  total: bigint;
  daily: bigint;
  perPayment: bigint;
  spent: bigint;
  paymentCount: number;
  maxPayments: number;
  validUntil: number;
  status: number;
  txHash: string;
};

const statusNames = ["None", "Active", "Paused", "Revoked", "Closed"];

export function MandateList({ detailId }: { detailId?: string }) {
  const wallet = useWallet();
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [vaultAddress, setVaultAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [notice, setNotice] = useState("");
  const [txHash, setTxHash] = useState("");

  const load = useCallback(async () => {
    if (!wallet.address || !wallet.provider || wallet.chainId !== BSC_TESTNET_CHAIN_ID) {
      setMandates([]);
      setVaultAddress("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const vaultInfo = await getVaultForOwner(wallet.provider, wallet.address);
      if (!vaultInfo) {
        setMandates([]);
        setVaultAddress("");
        return;
      }
      setVaultAddress(vaultInfo.address);
      const events = await getVaultEvents(vaultInfo.address, vaultInfo.fromBlock);
      const createdEvents = events.filter((event) => event.parsed?.name === "MandateCreated");
      const providerEvents = events.filter((event) => event.parsed?.name === "ProviderAllowed");
      const rows = await Promise.all(createdEvents.map(async (event) => {
        const mandateId = String(event.parsed!.args.mandateId ?? event.parsed!.args[0]);
        const state = await vaultContract(vaultInfo.address, wallet.provider!).getMandate(mandateId);
        const provider = providerEvents.find((candidate) => String(candidate.parsed!.args.mandateId ?? candidate.parsed!.args[0]).toLowerCase() === mandateId.toLowerCase());
        const cfg = state.config;
        return {
          id: mandateId,
          agent: String(cfg.agent),
          merchant: String(provider?.parsed?.args.merchant ?? ""),
          serviceId: String(provider?.parsed?.args.serviceId ?? ""),
          total: BigInt(cfg.totalLimit),
          daily: BigInt(cfg.dailyLimit),
          perPayment: BigInt(cfg.perPaymentLimit),
          spent: BigInt(state.spentTotal),
          paymentCount: Number(state.paymentCount),
          maxPayments: Number(cfg.maxPayments),
          validUntil: Number(cfg.validUntil),
          status: Number(state.status),
          txHash: event.transactionHash,
        };
      }));
      setMandates(rows);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load mandate events from BNB Testnet.");
    } finally {
      setLoading(false);
    }
  }, [wallet.address, wallet.chainId, wallet.provider]);

  useEffect(() => { void load(); }, [load, wallet.refreshVersion]);

  async function changeStatus(mandate: Mandate, action: "pauseMandate" | "resumeMandate" | "revokeMandate") {
    if (!wallet.signer || !vaultAddress) return;
    setPending(mandate.id);
    setError("");
    setNotice("");
    setTxHash("");
    try {
      const tx = await vaultContract(vaultAddress, wallet.signer)[action](mandate.id);
      setTxHash(tx.hash);
      await tx.wait();
      setNotice(`Mandate ${action === "pauseMandate" ? "paused" : action === "resumeMandate" ? "resumed" : "revoked"} on-chain.`);
      wallet.refresh();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The mandate status transaction failed.");
    } finally {
      setPending("");
    }
  }

  const mandate = mandates.find((item) => item.id.toLowerCase() === detailId?.toLowerCase());

  if (detailId) {
    if (!wallet.address) return <section className="state-panel"><p className="eyebrow">Wallet needed</p><h1>Connect to read this mandate.</h1><p>Mandate details come from your own vault contract.</p><button className="button button-light" onClick={() => void wallet.connect().catch(() => undefined)}>Connect wallet</button></section>;
    if (wallet.chainId !== BSC_TESTNET_CHAIN_ID) return <section className="state-panel"><p className="eyebrow">Wrong network</p><h1>Switch to BNB Smart Chain Testnet.</h1><button className="button button-light" onClick={() => void wallet.switchToTestnet().catch(() => undefined)}>Switch network</button></section>;
    if (loading) return <section className="state-panel" aria-live="polite"><span className="state-loader" aria-hidden="true"/><p className="eyebrow">Reading BNB Testnet</p><h1>Loading mandate state.</h1></section>;
    if (error) return <section className="state-panel error-state" role="alert"><p className="eyebrow">Contract read failed</p><h1>Mandate unavailable.</h1><p>{error}</p></section>;
    if (!mandate) return <section className="state-panel"><p className="eyebrow">No matching on-chain mandate</p><h1>This mandate id was not found.</h1><p>The detail view only resolves mandate ids emitted by the connected wallet's vault.</p><Link className="button secondary" href="/app/mandates">All mandates</Link></section>;
    return <>
      <div className="page-heading"><div><p className="eyebrow">On-chain mandate</p><h1>{statusNames[mandate.status] ?? "Unknown status"}</h1><p>Created from your vault. Amount limits and status below are read from the contract.</p></div><Link className="button secondary" href="/app/mandates">All mandates</Link></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="detail-grid">
        <div className="surface"><p className="eyebrow">Budget status</p><h2>{formatMUSD(mandate.total - mandate.spent)} mUSD remains</h2><div className="meter"><i style={{ width: `${mandate.total > 0n ? Math.min(100, Number(mandate.spent * 100n / mandate.total)) : 0}%` }}/></div><dl className="facts"><div><dt>Total budget</dt><dd>{formatMUSD(mandate.total)} mUSD</dd></div><div><dt>Per payment</dt><dd>{formatMUSD(mandate.perPayment)} mUSD</dd></div><div><dt>Daily cap</dt><dd>{formatMUSD(mandate.daily)} mUSD</dd></div><div><dt>Payments</dt><dd>{mandate.paymentCount} / {mandate.maxPayments}</dd></div><div><dt>Expires</dt><dd>{new Date(mandate.validUntil * 1000).toLocaleString()}</dd></div></dl></div>
        <div className="surface"><p className="eyebrow">On-chain permission</p><dl className="facts"><div><dt>Mandate id</dt><dd><code>{mandate.id}</code></dd></div><div><dt>Agent</dt><dd><code>{mandate.agent}</code></dd></div><div><dt>Merchant</dt><dd><code>{mandate.merchant || "No provider event"}</code></dd></div><div><dt>Service id</dt><dd><code>{mandate.serviceId || "No provider event"}</code></dd></div></dl><p className="surface-note">The readable service label is hashed before it is stored on-chain.</p></div>
      </section>
      {(notice || txHash) && <div className="tx-notice" role="status">{notice || "Transaction submitted to your wallet."} {txHash && <a href={`${EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}</div>}
      {wallet.chainId === BSC_TESTNET_CHAIN_ID && <div className="inline-actions mandate-controls">
        {mandate.status === 1 && <Link className="button button-light" href={`/app/runs/new?mandateId=${mandate.id}`}>Run invoice check</Link>}
        {mandate.status === 1 && <button className="button secondary" disabled={!!pending} onClick={() => void changeStatus(mandate, "pauseMandate")}>{pending ? "Waiting…" : "Pause mandate"}</button>}
        {mandate.status === 2 && <button className="button secondary" disabled={!!pending} onClick={() => void changeStatus(mandate, "resumeMandate")}>{pending ? "Waiting…" : "Resume mandate"}</button>}
        {(mandate.status === 1 || mandate.status === 2) && <button className="button secondary" disabled={!!pending} onClick={() => void changeStatus(mandate, "revokeMandate")}>{pending ? "Waiting…" : "Revoke mandate"}</button>}
      </div>}
      <p className="surface-note"><a href={`${EXPLORER_BASE}/address/${vaultAddress}`} target="_blank" rel="noreferrer">Open vault contract ↗</a></p>
    </>;
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">Mandates · BNB Testnet</p><h1>Spending authority.</h1><p>Mandates listed here are loaded from your vault's contract events.</p></div><Link className="button button-light" href="/app/mandates/new">Create a mandate</Link></div>
    {!wallet.address && <section className="state-panel"><p className="eyebrow">Wallet needed</p><h2>Connect to read your mandates.</h2><p>No sample mandates are shown. The list is built from your connected wallet's on-chain vault.</p><button className="button button-light" onClick={() => void wallet.connect().catch(() => undefined)}>Connect wallet</button></section>}
    {wallet.address && wallet.chainId !== BSC_TESTNET_CHAIN_ID && <section className="state-panel"><p className="eyebrow">Wrong network</p><h2>Switch to BNB Smart Chain Testnet.</h2><button className="button button-light" onClick={() => void wallet.switchToTestnet().catch(() => undefined)}>Switch network</button></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && loading && <section className="state-panel" aria-live="polite"><span className="state-loader" aria-hidden="true"/><p className="eyebrow">Reading BNB Testnet</p><h2>Loading mandate events.</h2></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && error && <p className="form-error" role="alert">{error}</p>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && !loading && !error && !vaultAddress && <section className="state-panel"><p className="eyebrow">No vault found</p><h2>Create and fund your personal vault first.</h2><Link className="button button-light" href="/app/setup">Open vault setup</Link></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && !loading && !error && vaultAddress && mandates.length === 0 && <section className="state-panel"><p className="eyebrow">No mandates yet</p><h2>Your vault has no mandate records.</h2><p>Create an on-chain mandate to set an agent, merchant, service id, budget, and expiry.</p><Link className="button button-light" href="/app/mandates/new">Create a mandate</Link></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && mandates.map((item) => <section className="surface mandate-row" key={item.id}><div><span className={`status ${item.status === 1 ? "confirmed" : ""}`}>{statusNames[item.status] ?? "Unknown"}</span><h2>{formatMUSD(item.total)} mUSD budget</h2><p>{formatMUSD(item.spent)} mUSD spent · {item.paymentCount} / {item.maxPayments} payments · expires {new Date(item.validUntil * 1000).toLocaleDateString()}</p></div><Link href={`/app/mandates/${item.id}`}>Review on-chain record</Link></section>)}
  </>;
}
