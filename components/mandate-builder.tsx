"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function MandateBuilder() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const next = (event: FormEvent) => { event.preventDefault(); setStep((value) => Math.min(value + 1, 3)); };
  if (submitted) return <section className="form-panel success-state"><p className="eyebrow">Fixture saved</p><h1>Mandate ready for wallet review.</h1><p>This demonstration does not create an on-chain mandate. Connect a verified wallet and contract deployment before using real testnet funds.</p><Link className="button button-light" href="/app/mandates/demo-mandate">Open fixture mandate</Link></section>;
  return <form className="form-panel" onSubmit={step === 3 ? (event) => { event.preventDefault(); setSubmitted(true); } : next}>
    <div className="form-progress"><span className={step >= 1 ? "current" : ""}>1. Authority</span><span className={step >= 2 ? "current" : ""}>2. Limits</span><span className={step >= 3 ? "current" : ""}>3. Review</span></div>
    {step === 1 && <><p className="eyebrow">Choose the boundary</p><h1>Who can pay whom?</h1><label>Delegated agent<input required defaultValue="Invoice review agent" /></label><label>Allowed service<input required defaultValue="Invoice-check API" /></label><label>Merchant address<input required defaultValue="0x89a…70f1" /></label></>}
    {step === 2 && <><p className="eyebrow">Set numerical limits</p><h1>What can this agent spend?</h1><div className="field-grid"><label>Total budget<input required inputMode="decimal" defaultValue="10.00" /><small>mUSD</small></label><label>Per-payment cap<input required inputMode="decimal" defaultValue="0.02" /><small>mUSD</small></label><label>Daily cap<input required inputMode="decimal" defaultValue="0.20" /><small>mUSD</small></label><label>Maximum payments<input required inputMode="numeric" defaultValue="10" /></label></div><label>Expires<input required type="date" defaultValue="2026-10-20" /></label></>}
    {step === 3 && <><p className="eyebrow">Review before signing</p><h1>The wallet should sign exactly this authority.</h1><dl className="review-list"><div><dt>Agent</dt><dd>Invoice review agent</dd></div><div><dt>Allowed merchant</dt><dd>0x89a…70f1</dd></div><div><dt>Service</dt><dd>Invoice-check API</dd></div><div><dt>Budget</dt><dd>10.00 mUSD, 0.02 mUSD each</dd></div><div><dt>Expiry</dt><dd>20 October 2026</dd></div></dl><p className="warning-copy">Pausing stops future payment attempts. Revoking releases the unused reservation after chain confirmation.</p></>}
    <div className="form-actions">{step > 1 && <button className="button secondary" type="button" onClick={() => setStep(step - 1)}>Back</button>}<button className="button button-light" type="submit">{step === 3 ? "Save demo mandate" : "Continue"}</button></div>
  </form>;
}
