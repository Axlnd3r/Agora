"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatToken } from "../lib/demo-domain";

type WorkspaceState = {
  mode: "fixture";
  network: { name: string; chainId: number };
  vault: { totalAtomic: string; reservedAtomic: string; spentAtomic: string; freeAtomic: string };
  mandate: { id: string; label: string; status: string; service: string; budgetAtomic: string; remainingAtomic: string };
  payment: { id: string; amountAtomic: string; status: string; deliveryStatus: string };
};

const replayStages = ["Checking mandate limits", "Verifying the signed quote fixture", "Loading the payment receipt fixture", "Loading the delivery fixture"];

export function DemoWorkspace() {
  const [data, setData] = useState<WorkspaceState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [replayStep, setReplayStep] = useState(-1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/demo/state", { cache: "no-store" });
      if (!response.ok) throw new Error("The fixture API did not return a workspace.");
      setData((await response.json()) as WorkspaceState);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The fixture workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (replayStep < 0 || replayStep >= replayStages.length) return;
    const timeout = window.setTimeout(() => setReplayStep((step) => step + 1), 650);
    return () => window.clearTimeout(timeout);
  }, [replayStep]);

  if (loading) return <WorkspaceLoading />;
  if (error) return <WorkspaceError message={error} onRetry={load} />;
  if (!data) return <WorkspaceEmpty />;

  const replayDone = replayStep >= replayStages.length;
  return <>
    <div className="testnet-banner"><strong>Fixture workspace.</strong> The API serves deterministic testnet-shaped data. This replay does not sign or broadcast a transaction.</div>
    <div className="page-heading dashboard-heading"><div><p className="eyebrow">Workspace overview</p><h1>Know exactly what the agent can spend.</h1><p>Track reserved budget, settlement evidence, and service delivery as separate records.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => setReplayStep(0)} disabled={replayStep >= 0 && !replayDone}>{replayDone ? "Replay again" : replayStep >= 0 ? "Replay running" : "Replay fixture flow"}</button><Link className="button button-light" href="/app/mandates/new">Create a mandate</Link></div></div>
    {replayStep >= 0 && <div className="replay-strip" aria-live="polite"><span className={replayDone ? "replay-indicator done" : "replay-indicator"} aria-hidden="true" /> <strong>{replayDone ? "Replay complete" : replayStages[replayStep]}</strong><small>{replayDone ? "Payment confirmation and delivery remained separate." : "Local fixture only"}</small></div>}
    <section className="balance-panel motion-surface" aria-labelledby="balance-title"><div><p className="eyebrow">Available to withdraw</p><h2 id="balance-title">{formatToken(data.vault.freeAtomic)} mUSD</h2><p>Out of {formatToken(data.vault.totalAtomic)} mUSD in the fixture vault.</p></div><dl><div><dt>Reserved</dt><dd>{formatToken(data.vault.reservedAtomic)} mUSD</dd></div><div><dt>Spent</dt><dd>{formatToken(data.vault.spentAtomic)} mUSD</dd></div><div><dt>Network</dt><dd>Chain {data.network.chainId}</dd></div></dl></section>
    <section className="workspace-grid"><div className="surface motion-surface"><div className="surface-head"><div><p className="eyebrow">One active mandate</p><h2>{data.mandate.label}</h2></div><Link href={`/app/mandates/${data.mandate.id}`}>View mandate</Link></div><div className="budget-line"><span>{formatToken(data.vault.spentAtomic)} mUSD spent</span><span>{formatToken(data.mandate.budgetAtomic)} mUSD reserved</span></div><div className="meter"><i style={{ width: "1%" }} /></div><p className="surface-note">Each settlement is bound to the {data.mandate.service} and its merchant quote.</p></div><div className="surface attention motion-surface"><p className="eyebrow">Evidence boundary</p><h2>Delivery remains independent</h2><p>The fixture payment is confirmed and the invoice result is delivered. Agora stores these as separate records.</p><Link href={`/app/payments/${data.payment.id}`}>Inspect proof</Link></div></section>
    <section className="activity-section"><div className="surface-head"><div><p className="eyebrow">Recent activity</p><h2>Receipt ledger</h2></div><Link href="/app/activity">All activity</Link></div><div className="activity-row"><span className="status confirmed">Confirmed</span><div><strong>Payment settled</strong><small>{data.mandate.service} · {formatToken(data.payment.amountAtomic)} mUSD · fixture</small></div><Link href={`/app/payments/${data.payment.id}`}>Proof</Link></div><div className="activity-row"><span className="status delivered">Delivered</span><div><strong>Invoice result received</strong><small>Separate delivery record · fixture</small></div><Link href="/app/runs/demo-run">Run timeline</Link></div></section>
  </>;
}

function WorkspaceLoading() {
  return <section className="state-panel" aria-live="polite"><span className="state-loader" aria-hidden="true" /><p className="eyebrow">Loading workspace</p><h1>Reading the fixture API.</h1><p>Agora is loading mandate, payment, and delivery records.</p></section>;
}

function WorkspaceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="state-panel error-state" role="alert"><p className="eyebrow">Workspace unavailable</p><h1>The fixture API could not be read.</h1><p>{message}</p><button className="button button-light" onClick={onRetry}>Retry fixture API</button></section>;
}

function WorkspaceEmpty() {
  return <section className="state-panel"><p className="eyebrow">Empty workspace</p><h1>No fixture state was returned.</h1><p>Reload the fixture API before creating a mandate.</p></section>;
}
