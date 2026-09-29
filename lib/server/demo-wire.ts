import { getAddress, isAddress, isHexString, type TypedDataDomain } from "ethers";
import { DEMO_PRICE, DEMO_SERVICE_ID, invoiceTypes, intentTypes, paymentDomain, type PaymentIntent, type SignedInvoice } from "../demo-payment";

type WireInvoice = Omit<SignedInvoice, "amount" | "validUntil"> & { amount: string; validUntil: string };
type WireIntent = Omit<PaymentIntent, "deadline"> & { deadline: string };

export type PaymentRequired = {
  x402Version: 2;
  resource: { url: string; description: string; mimeType: "application/json" };
  accepts: [{
    scheme: "mandatepay"; network: "eip155:97"; amount: string; asset: string;
    payTo: string; maxTimeoutSeconds: 120;
    extra: { schemeVersion: 1; assetTransferMethod: "mandate-vault-v1"; paymentFlow: "upfront"; vault: string; invoice: WireInvoice; merchantSignature: string };
  }];
};

export type PaymentPayload = {
  x402Version: 2;
  resource: PaymentRequired["resource"];
  accepted: PaymentRequired["accepts"][number];
  payload: { invoice: WireInvoice; merchantSignature: string; intent: WireIntent; agentSignature: string };
};

export function toWireInvoice(invoice: SignedInvoice): WireInvoice {
  return { ...invoice, amount: invoice.amount.toString(), validUntil: invoice.validUntil.toString() };
}

export function fromWireInvoice(value: WireInvoice): SignedInvoice {
  if (!value || !isHexString(value.invoiceId, 32) || !isHexString(value.requestId, 32)
    || !isHexString(value.mandateId, 32) || !isHexString(value.serviceId, 32)
    || !isHexString(value.requestHash, 32) || !isAddress(value.vault)
    || !isAddress(value.token) || !isAddress(value.merchant)
    || !/^[1-9][0-9]*$/.test(value.amount) || !/^[1-9][0-9]*$/.test(value.validUntil)) {
    throw new Error("Invalid signed invoice.");
  }
  return { ...value, amount: BigInt(value.amount), validUntil: BigInt(value.validUntil) };
}

export function fromWireIntent(value: WireIntent): PaymentIntent {
  if (!value || !isHexString(value.mandateId, 32) || !isHexString(value.invoiceDigest, 32) || !/^[1-9][0-9]*$/.test(value.deadline)) {
    throw new Error("Invalid payment intent.");
  }
  return { ...value, deadline: BigInt(value.deadline) };
}

export function encodeHeader(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

export function decodeHeader<T>(value: string | null): T {
  if (!value || value.length > 16_384 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new Error("Invalid payment header.");
  const decoded = Buffer.from(value, "base64").toString("utf8");
  if (Buffer.byteLength(decoded) > 8_192) throw new Error("Payment header exceeds 8 KiB.");
  return JSON.parse(decoded) as T;
}

export function assertRequirement(required: PaymentRequired, invoice: SignedInvoice) {
  const accepted = required.accepts?.[0];
  if (required.x402Version !== 2 || !accepted || accepted.scheme !== "mandatepay" || accepted.network !== "eip155:97"
    || accepted.extra?.schemeVersion !== 1 || accepted.extra?.assetTransferMethod !== "mandate-vault-v1"
    || accepted.extra?.paymentFlow !== "upfront" || accepted.amount !== DEMO_PRICE.toString()
    || accepted.amount !== invoice.amount.toString() || getAddress(accepted.asset) !== getAddress(invoice.token)
    || getAddress(accepted.payTo) !== getAddress(invoice.merchant)
    || getAddress(accepted.extra.vault) !== getAddress(invoice.vault)
    || invoice.serviceId.toLowerCase() !== DEMO_SERVICE_ID.toLowerCase()) {
    throw new Error("Payment requirements do not match the signed invoice.");
  }
}

export const typedInvoice = invoiceTypes;
export const typedIntent = intentTypes;
export const typedDomain = paymentDomain as (vault: string) => TypedDataDomain;
