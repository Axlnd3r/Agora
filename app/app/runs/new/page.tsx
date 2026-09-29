import { DemoRunForm } from "../../../../components/demo-run-form";
import demoDeployment from "../../../../deployments/demo-testnet.json";

export default async function SettlementStatusPage({ searchParams }: { searchParams: Promise<{ mandateId?: string }> }) {
  const { mandateId } = await searchParams;
  return <>
    <div className="page-heading"><div><p className="eyebrow">Paid task demo</p><h1>Run one bounded payment.</h1><p>The configured planner selects the invoice-check service for a supported task. The service checks arithmetic after an on-chain payment. Planner mode is shown below.</p></div></div>
    <DemoRunForm initialMandateId={mandateId ?? demoDeployment.mandateId} />
  </>;
}
