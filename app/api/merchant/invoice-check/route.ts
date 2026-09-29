import { getAddress, keccak256, solidityPacked, TypedDataEncoder, verifyTypedData } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import deployment from "../../../../deployments/bsc-testnet.json";
import { checkInvoice, DEMO_PATH, DEMO_PRICE, invoiceTypes, intentTypes, parseDemoRequest, paymentDomain, requestHash, type SignedInvoice } from "../../../../lib/demo-payment";
import { DEMO_VAULT, findSettledPayment, requireDemoMandate, settleInvoice, type SettledPayment } from "../../../../lib/server/demo-chain";
import { demoReady, demoWallet, internalTokenMatches } from "../../../../lib/server/demo-config";
import { assertRequirement, decodeHeader, encodeHeader, fromWireIntent, fromWireInvoice, toWireInvoice, type PaymentPayload, type PaymentRequired } from "../../../../lib/server/demo-wire";

export const maxDuration = 60;

function delivered(request: ReturnType<typeof parseDemoRequest>, payment: SettledPayment) {
  const result = { requestId: request.requestId, status: "checked", ...checkInvoice(request.invoice), payment: { network: "eip155:97", transaction: payment.transaction, amount: payment.amount } };
  const response = { success: true, transaction: payment.transaction, network: "eip155:97", payer: DEMO_VAULT, amount: payment.amount };
  return NextResponse.json(result, { headers: { "PAYMENT-RESPONSE": encodeHeader(response), "Cache-Control": "no-store" } });
}

export async function POST(httpRequest: NextRequest) {
  if (!demoReady()) return NextResponse.json({ error: "Demo signers are not configured." }, { status: 503 });
  if (!internalTokenMatches(httpRequest.headers.get("x-agora-internal-token"))) return NextResponse.json({ error: "Unauthorized merchant request." }, { status: 401 });

  try {
    const request = parseDemoRequest(await httpRequest.json());
    const existing = await findSettledPayment(request);
    if (existing) return delivered(request, existing);
    const { vault } = await requireDemoMandate(request);
    const header = httpRequest.headers.get("PAYMENT-SIGNATURE");
    if (!header) {
      const merchant = demoWallet("MERCHANT");
      const validUntil = BigInt(Math.floor(Date.now() / 1000) + 120);
      const invoice: SignedInvoice = {
        invoiceId: keccak256(solidityPacked(["bytes32", "uint64"], [request.requestId, validUntil])),
        requestId: request.requestId, mandateId: request.mandateId, serviceId: request.serviceId,
        requestHash: requestHash(request), vault: DEMO_VAULT, token: deployment.contracts.DemoUSD,
        merchant: merchant.address, amount: DEMO_PRICE, validUntil,
      };
      const merchantSignature = await merchant.signTypedData(paymentDomain(DEMO_VAULT), invoiceTypes, invoice);
      const required: PaymentRequired = {
        x402Version: 2,
        resource: { url: new URL(DEMO_PATH, httpRequest.url).toString(), description: "Check invoice arithmetic", mimeType: "application/json" },
        accepts: [{ scheme: "mandatepay", network: "eip155:97", amount: DEMO_PRICE.toString(),
          asset: deployment.contracts.DemoUSD, payTo: merchant.address, maxTimeoutSeconds: 120,
          extra: { schemeVersion: 1, assetTransferMethod: "mandate-vault-v1", paymentFlow: "upfront", vault: DEMO_VAULT,
            invoice: toWireInvoice(invoice), merchantSignature } }],
      };
      return NextResponse.json({ message: "Payment is required before invoice-check runs." }, {
        status: 402, headers: { "PAYMENT-REQUIRED": encodeHeader(required), "Cache-Control": "no-store" },
      });
    }

    const payment = decodeHeader<PaymentPayload>(header);
    const invoice = fromWireInvoice(payment.payload?.invoice);
    const intent = fromWireIntent(payment.payload?.intent);
    if (payment.x402Version !== 2 || payment.accepted?.scheme !== "mandatepay"
      || payment.resource?.url !== new URL(DEMO_PATH, httpRequest.url).toString()) throw new Error("Invalid payment payload.");
    assertRequirement({ x402Version: 2, resource: payment.resource, accepts: [payment.accepted] }, invoice);
    if (JSON.stringify(payment.accepted.extra.invoice) !== JSON.stringify(payment.payload.invoice)
      || payment.accepted.extra.merchantSignature !== payment.payload.merchantSignature) throw new Error("Quote and payload differ.");
    if (invoice.requestId.toLowerCase() !== request.requestId.toLowerCase()
      || invoice.mandateId.toLowerCase() !== request.mandateId.toLowerCase()
      || invoice.serviceId.toLowerCase() !== request.serviceId.toLowerCase()
      || invoice.requestHash.toLowerCase() !== requestHash(request).toLowerCase()
      || getAddress(invoice.vault) !== getAddress(DEMO_VAULT)
      || getAddress(invoice.token) !== getAddress(deployment.contracts.DemoUSD)
      || getAddress(invoice.merchant) !== demoWallet("MERCHANT").address
      || invoice.amount !== DEMO_PRICE) throw new Error("Invoice does not match the requested service.");
    if (invoice.validUntil <= BigInt(Math.floor(Date.now() / 1000))) throw new Error("Merchant quote expired.");
    if (verifyTypedData(paymentDomain(DEMO_VAULT), invoiceTypes, invoice, payment.payload.merchantSignature) !== invoice.merchant) throw new Error("Invalid merchant signature.");
    const digest = TypedDataEncoder.hash(paymentDomain(DEMO_VAULT), invoiceTypes, invoice);
    const chainDigest: string = await vault.hashInvoice(invoice);
    if (digest.toLowerCase() !== chainDigest.toLowerCase() || intent.invoiceDigest.toLowerCase() !== digest.toLowerCase()
      || intent.mandateId.toLowerCase() !== invoice.mandateId.toLowerCase()
      || intent.deadline > invoice.validUntil) throw new Error("Payment intent does not match the signed invoice.");
    if (verifyTypedData(paymentDomain(DEMO_VAULT), intentTypes, intent, payment.payload.agentSignature) !== demoWallet("AGENT").address) throw new Error("Invalid agent signature.");
    const settled = await settleInvoice(invoice, payment.payload.merchantSignature, intent, payment.payload.agentSignature);
    return delivered(request, settled);
  } catch (reason) {
    if (reason && typeof reason === "object" && "code" in reason) {
      return NextResponse.json({ error: "Testnet RPC is busy or settlement is pending. Retry with the same request ID." },
        { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "3" } });
    }
    const message = reason instanceof Error ? reason.message : "Merchant request failed.";
    const status = message.includes("already paid for different content") ? 409 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
