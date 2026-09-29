"use client";

import Link from "next/link";
import { getAddress, hexlify, randomBytes } from "ethers";
import { FormEvent, useEffect, useRef, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, explorerTx, formatMUSD } from "../lib/chain";
import { DEMO_SERVICE_ID, parseDemoRequest, runAuthorizationMessage } from "../lib/demo-payment";
import { useWallet } from "./wallet-provider";

type Config = { ready: boolean; reason?: string; owner?: string; vault?: string; agent?: string; merchant?: string; relayer?: string; planner?: { mode: string; model: string } };
type Result = { status: string; requestId: string; computedSubtotalMinor: string; computedTotalMinor: string; declaredTotalMinor: string; validTotal: boolean; issues: string[]; payment: { transaction: string; amount: string }; flow: { challengeStatus: number; scheme?: string; recoveredFromChain?: boolean; planner?: { mode: "fixture" | "live"; reason: string; model?: string; responseId?: string } } };
const PENDING_KEY = "agora:pending-invoice-check";

function forgetPending() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* Browser storage may be disabled. */ }
}

export function DemoRunForm({ initialMandateId = "" }: { initialMandateId?: string }) {
  const wallet = useWallet();
  const [config, setConfig] = useState<Config | null>(null);
  const [mandateId, setMandateId] = useState(initialMandateId);
  const [task, setTask] = useState("Periksa perhitungan invoice ini.");
  const [reference, setReference] = useState("INV-DEMO-001");
  const [description, setDescription] = useState("Jasa desain");
  const [quantity, setQuantity] = useState("2");
  const [unitPriceMinor, setUnitPriceMinor] = useState("100000");
  const [declaredTotalMinor, setDeclaredTotalMinor] = useState("200000");
  const [requestId, setRequestId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const paymentDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = paymentDialog.current;
    if (!dialog) return;
    if (showPaymentDialog && result && !dialog.open) dialog.showModal();
    if (!showPaymentDialog && dialog.open) dialog.close();
  }, [showPaymentDialog, result]);

  useEffect(() => {
    void fetch("/api/demo/config", { cache: "no-store" })
      .then((response) => response.json()).then((data: Config) => setConfig(data))
      .catch(() => setConfig({ ready: false, reason: "Could not load demo configuration." }));
    try {
      const saved = sessionStorage.getItem(PENDING_KEY);
      if (!saved) return;
      const request = parseDemoRequest(JSON.parse(saved));
      if (request.invoice.items.length !== 1) throw new Error("Invalid saved task.");
      setRequestId(request.requestId);
      setMandateId(request.mandateId);
      setTask(request.task ?? "Periksa perhitungan invoice ini.");
      setReference(request.invoice.reference);
      setDescription(request.invoice.items[0].description);
      setQuantity(request.invoice.items[0].quantity);
      setUnitPriceMinor(request.invoice.items[0].unitPriceMinor);
      setDeclaredTotalMinor(request.invoice.declaredTotalMinor);
    } catch { forgetPending(); }
  }, []);

  function change(setter: (value: string) => void, value: string) {
    setter(value);
    setRequestId("");
    setResult(null);
    setShowPaymentDialog(false);
    forgetPending();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setShowPaymentDialog(false);
    if (!config?.ready || !config.vault || !config.owner || !wallet.signer || !wallet.address) {
      setError("Connect the configured demo owner wallet first."); return;
    }
    if (wallet.chainId !== BSC_TESTNET_CHAIN_ID || getAddress(wallet.address) !== getAddress(config.owner)) {
      setError("Switch to BNB Testnet and connect the demo owner wallet."); return;
    }
    const stableId = requestId || hexlify(randomBytes(32));
    setRequestId(stableId);
    let request;
    try {
      request = parseDemoRequest({
        requestId: stableId, mandateId, vault: config.vault, serviceId: DEMO_SERVICE_ID, task,
        invoice: { reference, currency: "IDR", items: [{ description, quantity, unitPriceMinor }],
          discountMinor: "0", taxMinor: "0", declaredTotalMinor },
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Invalid invoice input."); return; }
    try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(request)); } catch { /* The run still works without session storage. */ }

    setPending(true);
    try {
      const authorizationDeadline = Math.floor(Date.now() / 1000) + 300;
      const ownerSignature = await wallet.signer.signMessage(runAuthorizationMessage(request, authorizationDeadline));
      const response = await fetch("/api/runs", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, authorizationDeadline, ownerSignature }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Paid service request failed.");
      setResult(body as Result);
      setShowPaymentDialog(true);
      wallet.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Paid service request failed.");
    } finally { setPending(false); }
  }

  return <>
    <section className="surface demo-run-info"><p className="eyebrow">Live testnet service</p><h2>One invoice check costs 0.02 mUSD.</h2>
      <p className="surface-note">The merchant returns HTTP 402 and a signed quote. The configured agent signs one payment intent. A relayer submits it to the vault; the merchant checks invoice arithmetic after the payment is confirmed.</p>
      {config?.planner && <p className="surface-note">Planner: {config.planner.mode === "live" ? `Gemini live (${config.planner.model})` : "fixture (deterministic)"}.</p>}
      {config?.ready && <dl className="facts"><div><dt>Agent signer</dt><dd><code>{config.agent}</code></dd></div><div><dt>Merchant recipient</dt><dd><code>{config.merchant}</code></dd></div><div><dt>Relayer</dt><dd><code>{config.relayer}</code></dd></div></dl>}
      {config && !config.ready && <p className="form-error" role="alert">{config.reason}</p>}
    </section>
    <form className="form-panel" onSubmit={(event) => void submit(event)}>
      <p className="eyebrow">Paid task input</p><h2>Check this invoice.</h2>
      <label>Agent task<input required maxLength={240} value={task} onChange={(event) => change(setTask, event.target.value)} /></label>
      <label>Mandate ID<input required value={mandateId} onChange={(event) => change(setMandateId, event.target.value)} placeholder="0x…" spellCheck={false} /></label>
      <div className="field-grid"><label>Reference<input required value={reference} onChange={(event) => change(setReference, event.target.value)} /></label><label>Item description<input required value={description} onChange={(event) => change(setDescription, event.target.value)} /></label></div>
      <div className="field-grid"><label>Quantity<input required inputMode="numeric" value={quantity} onChange={(event) => change(setQuantity, event.target.value)} /></label><label>Unit price, IDR minor<input required inputMode="numeric" value={unitPriceMinor} onChange={(event) => change(setUnitPriceMinor, event.target.value)} /></label></div>
      <label>Declared total, IDR minor<input required inputMode="numeric" value={declaredTotalMinor} onChange={(event) => change(setDeclaredTotalMinor, event.target.value)} /></label>
      <p className="surface-note">The IDR figures are invoice data. The service fee is paid separately in test mUSD.</p>
      {error && <p className="form-error" role="alert">{error} {requestId && "Retry uses the same request ID."}</p>}
      {requestId && <p className="surface-note">This request ID is kept across page refreshes. Repeating it returns the same paid result; start a new request to make another payment.</p>}
      <div className="form-actions"><Link className="button secondary" href="/app/mandates">Review mandates</Link>{requestId && <button className="button secondary" type="button" disabled={pending} onClick={() => { setRequestId(""); setResult(null); setShowPaymentDialog(false); setError(""); forgetPending(); }}>New request</button>}<button className="button button-light" type="submit" disabled={pending || !config?.ready || !wallet.address || wallet.chainId !== BSC_TESTNET_CHAIN_ID}>{pending ? "Checking payment and delivery…" : "Run paid invoice check"}</button></div>
    </form>
    {result && <section className="surface success-state" role="status"><p className="eyebrow">Confirmed payment and delivery</p><h2>{result.validTotal ? "Invoice total matches." : "Invoice total differs."}</h2>
      {result.flow.recoveredFromChain
        ? <p>Paid result recovered from chain; the planner was not rerun.</p>
        : <p>{result.flow.planner?.mode === "live" ? `Gemini live (${result.flow.planner.model})` : "Fixture planner"}: {result.flow.planner?.reason ?? "Invoice-check service selected."}</p>}
      <p>Computed total: {result.computedTotalMinor} IDR minor units. Declared total: {result.declaredTotalMinor}.</p>
      <p>HTTP {result.flow.challengeStatus} → {result.flow.recoveredFromChain ? "recovered paid result" : "signed intent → on-chain settlement → delivered result"}.</p>
      <a href={explorerTx(result.payment.transaction)} target="_blank" rel="noreferrer">View confirmed payment on BscScan ↗</a>
    </section>}
    <dialog ref={paymentDialog} className="payment-dialog" aria-labelledby="payment-dialog-title" onClose={() => setShowPaymentDialog(false)}>
      {result && <div className="payment-dialog-content"><p className="eyebrow">Payment confirmed · BNB Testnet</p><h2 id="payment-dialog-title">Invoice check delivered.</h2>
        <p className="payment-dialog-lede">{formatMUSD(result.payment.amount)} mUSD paid to the merchant. {result.validTotal ? "The invoice total matches." : "The invoice total differs."}</p>
        <dl className="payment-dialog-facts"><div><dt>Computed total</dt><dd>{result.computedTotalMinor} IDR minor units</dd></div><div><dt>Declared total</dt><dd>{result.declaredTotalMinor} IDR minor units</dd></div><div><dt>Transaction</dt><dd><code>{result.payment.transaction}</code></dd></div></dl>
        <p className="surface-note">{result.flow.recoveredFromChain ? "This result was recovered from the existing payment." : `HTTP 402 → signed intent → on-chain settlement → delivered result${result.flow.planner?.mode === "live" ? ` · ${result.flow.planner.model}` : ""}.`}</p>
        <div className="payment-dialog-actions"><button type="button" className="button button-light" autoFocus onClick={() => paymentDialog.current?.close()}>Continue</button><a className="button secondary" href={explorerTx(result.payment.transaction)} target="_blank" rel="noreferrer">View on BscScan ↗</a></div>
      </div>}
    </dialog>
  </>;
}
