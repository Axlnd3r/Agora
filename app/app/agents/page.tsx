import Link from "next/link";

export default function AgentsPage() {
  return <>
    <div className="page-heading"><div><p className="eyebrow">Agent permissions</p><h1>Agents live inside mandates.</h1><p>The contracts have no separate agent registry. Each mandate records one agent address and limits its allowed payments.</p></div><Link className="button button-light" href="/app/mandates/new">Create a mandate</Link></div>
    <section className="surface"><p className="eyebrow">Demo agent</p><h2>Its signer is selected in the mandate.</h2><p className="surface-note">Use “Use configured demo service” when creating a mandate. The server-side agent signs a payment intent for the fixed invoice-check task after the owner authorizes the run. This demo uses a deterministic task executor, without an LLM planner.</p><Link href="/app/mandates">View on-chain mandates</Link></section>
  </>;
}
