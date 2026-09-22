"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type RunResponse = { id: string; mode: "fixture"; stages: string[] };

export function DemoRunForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState<RunResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/demo/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceReference: values.get("invoiceReference"), task: values.get("task") }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "The fixture run was rejected.");
      setRun(result as RunResponse);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The fixture run could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  if (run) {
    return <section className="form-panel success-state" aria-live="polite"><p className="eyebrow">Fixture run created</p><h1>The deterministic executor accepted this replay.</h1><p>Run ID: <code>{run.id}</code>. No wallet signature or transaction was produced.</p><Link className="button button-light" href="/app/runs/demo-run">Open the fixture timeline</Link></section>;
  }

  return <form className="form-panel" onSubmit={submit}>
    <p className="eyebrow">Start a paid task</p><h1>Review a synthetic invoice.</h1><p>Agora validates this input through its local fixture API. A live deployment would request a quote and verify it against the active mandate before settlement.</p>
    <label>Invoice reference<input name="invoiceReference" required minLength={3} maxLength={80} placeholder="Synthetic invoice reference" /></label>
    <label>Task<input name="task" required minLength={8} maxLength={500} placeholder="Describe the invoice check" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-light" type="submit" disabled={submitting}>{submitting ? "Validating fixture" : "Create fixture run"}</button>
  </form>;
}
