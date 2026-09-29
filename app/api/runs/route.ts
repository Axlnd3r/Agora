import { getAddress, TypedDataEncoder, verifyMessage, verifyTypedData } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import deployment from "../../../deployments/bsc-testnet.json";
import { DEMO_PATH, DEMO_PRICE, invoiceTypes, intentTypes, parseDemoRequest, paymentDomain, requestHash, runAuthorizationMessage } from "../../../lib/demo-payment";
import { DEMO_OWNER, DEMO_VAULT, requireDemoMandate } from "../../../lib/server/demo-chain";
import { demoReady, demoWallet } from "../../../lib/server/demo-config";
import { planDemoTask, plannerConfig, PlannerUnavailable } from "../../../lib/server/demo-planner";
import { assertRequirement, decodeHeader, encodeHeader, fromWireInvoice, toWireInvoice, type PaymentPayload, type PaymentRequired } from "../../../lib/server/demo-wire";

export const maxDuration = 60;

export async function POST(httpRequest: NextRequest) {
  if (!demoReady()) return NextResponse.json({ error: "Demo signers are not configured." }, { status: 503 });
  try {
    const body = await httpRequest.json();
    const request = parseDemoRequest(body.request);
    const deadline = Number(body.authorizationDeadline);
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isSafeInteger(deadline) || deadline < now || deadline > now + 300 || typeof body.ownerSignature !== "string") {
      throw new Error("Wallet authorization expired or is invalid.");
    }
    const recovered = verifyMessage(runAuthorizationMessage(request, deadline), body.ownerSignature);
    if (getAddress(recovered) !== getAddress(DEMO_OWNER)) throw new Error("Only the demo vault owner can run this service.");
    if (getAddress(request.vault) !== getAddress(DEMO_VAULT)) throw new Error("Unexpected demo vault.");

    const merchantUrl = new URL(DEMO_PATH, httpRequest.url);
    const headers: Record<string, string> = { "Content-Type": "application/json", "x-agora-internal-token": process.env.AGORA_INTERNAL_TOKEN! };
    const cookie = httpRequest.headers.get("cookie");
    if (cookie) headers.cookie = cookie;
    const first = await fetch(merchantUrl, { method: "POST", headers, body: JSON.stringify(request), cache: "no-store" });
    if (first.status === 200) return NextResponse.json({ ...await first.json(), flow: { challengeStatus: 200, recoveredFromChain: true } });
    if (first.status !== 402) return NextResponse.json(await first.json(), { status: first.status });
    const { vault, mandate } = await requireDemoMandate(request);
    if (!plannerConfig().ready) throw new PlannerUnavailable("Live planner is not configured.");
    const plan = await planDemoTask(request.task);
    if (plan.decision !== "use_service") return NextResponse.json({ error: plan.reason, planner: plan }, { status: 422 });

    const required = decodeHeader<PaymentRequired>(first.headers.get("PAYMENT-REQUIRED"));
    if (required.resource?.url !== merchantUrl.toString()) throw new Error("Quote resource URL differs from the trusted merchant.");
    const accepted = required.accepts[0];
    const invoice = fromWireInvoice(accepted.extra.invoice);
    assertRequirement(required, invoice);
    if (invoice.requestId.toLowerCase() !== request.requestId.toLowerCase()
      || invoice.mandateId.toLowerCase() !== request.mandateId.toLowerCase()
      || invoice.serviceId.toLowerCase() !== request.serviceId.toLowerCase()
      || invoice.requestHash.toLowerCase() !== requestHash(request).toLowerCase()
      || getAddress(invoice.vault) !== getAddress(DEMO_VAULT)
      || getAddress(invoice.token) !== getAddress(deployment.contracts.DemoUSD)
      || getAddress(invoice.merchant) !== demoWallet("MERCHANT").address
      || invoice.amount !== DEMO_PRICE) throw new Error("Merchant quote does not match the authorized request.");
    if (verifyTypedData(paymentDomain(DEMO_VAULT), invoiceTypes, invoice, accepted.extra.merchantSignature) !== invoice.merchant) throw new Error("Merchant quote signature is invalid.");
    const invoiceDigest = TypedDataEncoder.hash(paymentDomain(DEMO_VAULT), invoiceTypes, invoice);
    const contractDigest: string = await vault.hashInvoice(invoice);
    if (invoiceDigest.toLowerCase() !== contractDigest.toLowerCase()) throw new Error("Quote digest differs from the deployed contract.");
    const intentDeadline = BigInt(Math.min(Number(invoice.validUntil), Number(mandate.config.validUntil), now + 120));
    if (intentDeadline <= BigInt(now)) throw new Error("Merchant quote expired.");
    const intent = { mandateId: request.mandateId, invoiceDigest, deadline: intentDeadline };
    const agentSignature = await demoWallet("AGENT").signTypedData(paymentDomain(DEMO_VAULT), intentTypes, intent);
    const payload: PaymentPayload = {
      x402Version: 2, resource: required.resource, accepted,
      payload: { invoice: toWireInvoice(invoice), merchantSignature: accepted.extra.merchantSignature,
        intent: { mandateId: intent.mandateId, invoiceDigest, deadline: intent.deadline.toString() }, agentSignature },
    };
    const second = await fetch(merchantUrl, { method: "POST", headers: { ...headers, "PAYMENT-SIGNATURE": encodeHeader(payload) },
      body: JSON.stringify(request), cache: "no-store" });
    return NextResponse.json({ ...await second.json(), flow: { challengeStatus: 402, scheme: "mandatepay", paymentFlow: "upfront", planner: plan } }, { status: second.status });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Run failed." },
      { status: reason instanceof PlannerUnavailable ? 503 : 400 });
  }
}
