import { sourceVerification } from "../lib/chain";

const names: Record<keyof typeof sourceVerification.contracts, string> = {
  DemoUSD: "DemoUSD",
  VaultFactory: "VaultFactory",
  MandateVault: "MandateVault",
};

export function ContractVerification() {
  return <section className="verified-contracts" aria-labelledby="verified-contracts-title">
    <div><p className="eyebrow">Source verification</p><h2 id="verified-contracts-title">Exact bytecode matches on Sourcify</h2><p>Public source and compiler settings match the deployed BNB Testnet contracts.</p></div>
    <ul>{Object.entries(sourceVerification.contracts).map(([key, record]) => <li key={key}><strong>{names[key as keyof typeof names]}</strong><span>{record.match.replace("_", " ")}</span><a href={record.url} target="_blank" rel="noreferrer">Source ↗</a><a href={record.bscScan} target="_blank" rel="noreferrer">BscScan ↗</a></li>)}</ul>
  </section>;
}
