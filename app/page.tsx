import Link from "next/link";
import { InteractivePortal } from "../components/interactive-portal";
import { MarketingHeader } from "../components/marketing-header";
import { Reveal } from "../components/reveal";

const steps = [
  ["01", "Write the mandate", "Choose the agent, service, budget limits, and expiry. The vault reserves only that amount."],
  ["02", "Run a paid task", "The agent requests a signed quote and submits an authorization bound to that one request."],
  ["03", "Read the receipt", "Agora records payment and service delivery separately so a confirmed transfer is never mistaken for a result."],
];

export default function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <InteractivePortal />
        <MarketingHeader />
        <div className="hero-copy">
          <p className="kicker">Programmable spending authority</p>
          <h1 id="hero-title">A bounded wallet<br />for every agent.</h1>
          <p className="lede">Agora lets an AI agent purchase a digital service under the limits you set. Budget, merchant, request count, and expiry stay attached to the mandate.</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/app">Open the demo workspace</Link>
            <a className="text-link" href="#architecture">See the control flow</a>
          </div>
        </div>
        <div className="hero-foot">
          <span>BNB Smart Chain Testnet</span>
          <span>Custom x402 scheme</span>
          <span>On-chain spending limits</span>
          <span>Verifiable payment receipts</span>
        </div>
      </section>

      <section className="section process" id="how-it-works" aria-labelledby="process-title">
        <Reveal>
          <div className="section-label">How Agora works</div>
          <h2 id="process-title">Permission comes first. Payment follows the rules.</h2>
          <div className="process-list">
            {steps.map(([number, title, description]) => (
              <article className="process-item" key={number}>
                <span className="step-number">{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section security" id="security" aria-labelledby="security-title">
        <Reveal className="security-copy">
          <div>
            <div className="section-label">A hard boundary</div>
            <h2 id="security-title">A compromised agent cannot spend beyond its mandate.</h2>
          </div>
          <p>The vault checks the designated agent, merchant, service, amount, daily cap, total cap, and expiry before it settles a payment. Agora is a hackathon MVP on BNB Smart Chain Testnet. Demo token has no monetary value. Contracts are not audited.</p>
        </Reveal>
      </section>

      <section className="architecture" id="architecture" aria-labelledby="architecture-title">
        <Reveal>
          <div className="section-label">Architecture</div>
          <h2 id="architecture-title">The owner sets the boundary. The chain enforces it.</h2>
          <div className="flow" role="img" aria-label="Owner creates a mandate for an agent. The agent can pay an allowed merchant through the vault. The vault creates a payment receipt.">
            <div className="flow-node"><span>01</span><strong>Owner</strong><small>sets authority</small></div>
            <i aria-hidden="true" />
            <div className="flow-node emphasis"><span>02</span><strong>Mandate vault</strong><small>checks every limit</small></div>
            <i aria-hidden="true" />
            <div className="flow-node"><span>03</span><strong>Agent</strong><small>signs intent</small></div>
            <i aria-hidden="true" />
            <div className="flow-node"><span>04</span><strong>Merchant</strong><small>returns delivery</small></div>
            <i aria-hidden="true" />
            <div className="flow-node"><span>05</span><strong>Receipt</strong><small>proves settlement</small></div>
          </div>
        </Reveal>
      </section>

      <footer className="footer">
        <span>Agora is built for the Finance &amp; Commerce and AI Agents tracks.</span>
        <Link href="/app">Enter demo workspace</Link>
      </footer>
    </main>
  );
}
