import Link from "next/link";
import { CinematicPortal } from "../components/interactive-portal";
import { MarketingHeader } from "../components/marketing-header";
import { Reveal } from "../components/reveal";

const steps = [
  ["01", "Create the mandate", "Set the agent, allowed merchant, budget limits, and expiry. The BNB Testnet vault reserves that amount."],
  ["02", "Control the vault", "The demo can fund the vault and pause, resume, or revoke mandates through your connected wallet."],
  ["03", "Buy one invoice check", "The demo agent signs an intent for a merchant quote. The vault settles 0.02 test mUSD before the result is delivered."],
];

function ProcessSilhouette({ step }: { step: string }) {
  if (step === "01") {
    return (
      <svg className="process-silhouette silhouette-write" viewBox="0 0 144 88" aria-hidden="true">
        <path className="silhouette-rule" d="M42 15.5h42l14 14V73H42z" />
        <path className="silhouette-rule" d="M84 15.5V30h14" />
        <path className="silhouette-copy" d="M53 41h32M53 50h32M53 59h22" />
        <path className="silhouette-pen" d="m96 59 17-17 7 7-17 17-9 2z" />
      </svg>
    );
  }

  if (step === "02") {
    return (
      <svg className="process-silhouette silhouette-run" viewBox="0 0 144 88" aria-hidden="true">
        <path className="silhouette-route" d="M24 66h35c13 0 11-39 26-39h35" />
        <rect className="silhouette-terminal" x="91" y="17" width="28" height="43" rx="2" />
        <path className="silhouette-copy" d="M98 27h14M98 34h9" />
        <circle className="silhouette-target" cx="105" cy="48" r="3" />
        <circle className="silhouette-runner" r="3.5">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M24 66h35c13 0 11-39 26-39h20" />
        </circle>
      </svg>
    );
  }

  return (
    <svg className="process-silhouette silhouette-receipt" viewBox="0 0 144 88" aria-hidden="true">
      <path className="silhouette-rule" d="M47 14h44l9 9v51l-7-4-7 4-7-4-7 4-7-4-7 4-7-4-7 4z" />
      <path className="silhouette-copy" d="M58 34h30M58 43h18" />
      <circle className="receipt-seal" cx="82" cy="58" r="10" />
      <path className="receipt-check" d="m77 58 4 4 7-8" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <CinematicPortal />
        <MarketingHeader />
        <div className="hero-copy">
          <h1 id="hero-title"><span>A bounded wallet</span><span>for every agent.</span></h1>
          <p className="lede">Set a spending mandate on BNB Testnet, then run one paid invoice check through an HTTP 402 quote and on-chain settlement.</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/app">Open the demo workspace</Link>
            <a className="text-link" href="#architecture">See the control flow</a>
          </div>
        </div>
        <div className="hero-foot">
          <span>BNB Smart Chain Testnet contracts deployed</span>
          <span>Wallet transactions enabled</span>
          <span>Mandate events read on-chain</span>
          <span>Contracts not audited</span>
        </div>
      </section>

      <section className="section process" id="how-it-works" aria-labelledby="process-title">
        <Reveal>
          <div className="section-label">How Agora works</div>
          <h2 id="process-title">From permission to a paid result.</h2>
          <div className="process-list">
            {steps.map(([number, title, description]) => (
              <article className="process-item" key={number}>
                <span className="step-number">{number}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <ProcessSilhouette step={number} />
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
          <p>The contract checks agent and merchant signatures, service, amount, daily cap, total cap, and expiry before settling a payment. This demo connects those checks to one deterministic invoice-check service on BNB Smart Chain Testnet. The mUSD token has no monetary value. Contracts are not audited.</p>
        </Reveal>
      </section>

      <section className="architecture" id="architecture" aria-labelledby="architecture-title">
        <Reveal>
          <div className="section-label">Settlement design</div>
          <h2 id="architecture-title">One paid service follows this contract flow.</h2>
          <div className="architecture-viewport" role="region" aria-label="Agora payment architecture diagram. Scroll horizontally on smaller screens." tabIndex={0}>
            <svg className="architecture-map" viewBox="0 0 1120 430" role="img" aria-labelledby="architecture-map-title architecture-map-description">
              <title id="architecture-map-title">Agora mandate and payment architecture</title>
              <desc id="architecture-map-description">The owner writes a mandate and the agent submits a signed payment intent. The merchant supplies a signed quote. The mandate vault checks the permissions and limits, then settles the token payment and emits a receipt. Service delivery is tracked separately.</desc>
              <defs>
                <marker id="architecture-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
                  <path d="M0 0 8 4 0 8" fill="none" stroke="currentColor" strokeWidth="1.2" />
                </marker>
              </defs>
              <g className="architecture-connectors" fill="none" markerEnd="url(#architecture-arrow)">
                <path d="M288 105 C340 105 336 156 390 156" />
                <path d="M288 322 C341 322 339 272 390 272" />
                <path d="M832 119 C778 119 787 166 730 166" />
                <path d="M730 230 C786 230 779 148 832 148" />
                <path d="M962 182v103" />
              </g>
              <g className="architecture-wire-labels">
                <text x="312" y="91">mandate limits</text>
                <text x="312" y="348">signed intent</text>
                <text x="746" y="100">signed quote</text>
                <text x="750" y="257">token settlement</text>
                <text x="978" y="244">delivery proof</text>
              </g>
              <g className="architecture-node">
                <path d="M28 62h260v88H28z" />
                <text className="architecture-index" x="48" y="87">01 / AUTHORITY</text>
                <text className="architecture-name" x="48" y="119">Owner</text>
                <text className="architecture-note" x="48" y="138">sets agent, merchant &amp; caps</text>
              </g>
              <g className="architecture-node">
                <path d="M28 278h260v88H28z" />
                <text className="architecture-index" x="48" y="303">02 / REQUEST</text>
                <text className="architecture-name" x="48" y="335">Agent</text>
                <text className="architecture-note" x="48" y="354">signs one bounded intent</text>
              </g>
              <g className="architecture-node architecture-vault">
                <path d="M390 100h340v200H390z" />
                <path className="architecture-vault-rule" d="M414 152h292M414 242h292" />
                <text className="architecture-index" x="420" y="130">03 / ON-CHAIN ENFORCEMENT</text>
                <text className="architecture-name" x="420" y="190">Mandate vault</text>
                <text className="architecture-note" x="420" y="218">agent · service · per-payment cap</text>
                <text className="architecture-note" x="420" y="275">daily cap · total cap · expiry · replay</text>
              </g>
              <g className="architecture-node">
                <path d="M832 62h260v120H832z" />
                <text className="architecture-index" x="852" y="87">04 / PAYEE</text>
                <text className="architecture-name" x="852" y="119">Merchant</text>
                <text className="architecture-note" x="852" y="140">quotes a service &amp; amount</text>
                <text className="architecture-note" x="852" y="160">delivery remains a separate proof</text>
              </g>
              <g className="architecture-node architecture-receipt">
                <path d="M832 285h260v88H832z" />
                <text className="architecture-index" x="852" y="310">05 / RECORD</text>
                <text className="architecture-name" x="852" y="342">Settlement receipt</text>
                <text className="architecture-note" x="852" y="361">payment event; not service completion</text>
              </g>
            </svg>
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
