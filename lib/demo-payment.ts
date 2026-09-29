import { id, isAddress, isHexString, keccak256, toUtf8Bytes } from "ethers";

export const DEMO_SERVICE = "invoice-check:v1";
export const DEMO_SERVICE_ID = id(DEMO_SERVICE);
export const DEMO_PRICE = 20_000n;
export const DEMO_PATH = "/v1/services/invoice-check";

export type InvoiceInput = {
  reference: string;
  currency: "IDR";
  items: { description: string; quantity: string; unitPriceMinor: string }[];
  discountMinor: string;
  taxMinor: string;
  declaredTotalMinor: string;
};

export type DemoRequest = {
  requestId: string;
  mandateId: string;
  vault: string;
  serviceId: string;
  task?: string;
  invoice: InvoiceInput;
};

export type SignedInvoice = {
  invoiceId: string;
  requestId: string;
  mandateId: string;
  serviceId: string;
  requestHash: string;
  vault: string;
  token: string;
  merchant: string;
  amount: bigint;
  validUntil: bigint;
};

export type PaymentIntent = { mandateId: string; invoiceDigest: string; deadline: bigint };

export const invoiceTypes = {
  Invoice: [
    { name: "invoiceId", type: "bytes32" }, { name: "requestId", type: "bytes32" },
    { name: "mandateId", type: "bytes32" }, { name: "serviceId", type: "bytes32" },
    { name: "requestHash", type: "bytes32" }, { name: "vault", type: "address" },
    { name: "token", type: "address" }, { name: "merchant", type: "address" },
    { name: "amount", type: "uint256" }, { name: "validUntil", type: "uint64" },
  ],
};

export const intentTypes = {
  PaymentIntent: [
    { name: "mandateId", type: "bytes32" }, { name: "invoiceDigest", type: "bytes32" },
    { name: "deadline", type: "uint64" },
  ],
};

export function paymentDomain(vault: string) {
  // This name is the constructor argument in the deployed MandateVault.
  return { name: "Agora", version: "1", chainId: 97, verifyingContract: vault };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = 120): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid ${label}.`);
  return value.trim();
}

function unsigned(value: unknown, label: string, positive = false): string {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,38})$/.test(value)) throw new Error(`Invalid ${label}.`);
  if (positive && value === "0") throw new Error(`${label} must be positive.`);
  return value;
}

function bytes32(value: unknown, label: string): string {
  if (typeof value !== "string" || !isHexString(value, 32) || /^0x0{64}$/i.test(value)) throw new Error(`Invalid ${label}.`);
  return value;
}

export function parseDemoRequest(value: unknown): DemoRequest {
  if (new TextEncoder().encode(JSON.stringify(value)).length > 32_768) throw new Error("Request exceeds 32 KiB.");
  const raw = record(value);
  const invoice = record(raw.invoice);
  if (!Array.isArray(invoice.items) || invoice.items.length < 1 || invoice.items.length > 100) throw new Error("Invoice needs 1 to 100 items.");
  const items = invoice.items.map((item, index) => {
    const row = record(item);
    return {
      description: text(row.description, `item ${index + 1} description`),
      quantity: unsigned(row.quantity, `item ${index + 1} quantity`, true),
      unitPriceMinor: unsigned(row.unitPriceMinor, `item ${index + 1} unit price`),
    };
  });
  const vault = text(raw.vault, "vault", 42);
  if (!isAddress(vault)) throw new Error("Invalid vault address.");
  const serviceId = bytes32(raw.serviceId, "service id");
  if (serviceId.toLowerCase() !== DEMO_SERVICE_ID.toLowerCase()) throw new Error("Unsupported service.");
  if (invoice.currency !== "IDR") throw new Error("This demo checks IDR invoice arithmetic only.");
  const result: DemoRequest = {
    requestId: bytes32(raw.requestId, "request id"),
    mandateId: bytes32(raw.mandateId, "mandate id"),
    vault,
    serviceId,
    ...(raw.task === undefined ? {} : { task: text(raw.task, "task", 240) }),
    invoice: {
      reference: text(invoice.reference, "invoice reference", 80), currency: "IDR", items,
      discountMinor: unsigned(invoice.discountMinor, "discount"),
      taxMinor: unsigned(invoice.taxMinor, "tax"),
      declaredTotalMinor: unsigned(invoice.declaredTotalMinor, "declared total"),
    },
  };
  checkInvoice(result.invoice);
  return result;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
    return `{${entries.map(([key, part]) => `${JSON.stringify(key)}:${canonical(part)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function requestHash(request: DemoRequest): string {
  return keccak256(toUtf8Bytes(canonical({ method: "POST", path: DEMO_PATH, body: request })));
}

export function runAuthorizationMessage(request: DemoRequest, deadline: number): string {
  return canonical({ action: "Agora invoice-check demo", chainId: 97, deadline, mandateId: request.mandateId, requestHash: requestHash(request), vault: request.vault });
}

export function checkInvoice(input: InvoiceInput) {
  const subtotal = input.items.reduce((sum, item) => sum + BigInt(item.quantity) * BigInt(item.unitPriceMinor), 0n);
  const discount = BigInt(input.discountMinor);
  if (discount > subtotal) throw new Error("Discount exceeds subtotal.");
  const total = subtotal - discount + BigInt(input.taxMinor);
  const declared = BigInt(input.declaredTotalMinor);
  return {
    computedSubtotalMinor: subtotal.toString(), computedTotalMinor: total.toString(),
    declaredTotalMinor: declared.toString(), validTotal: total === declared,
    issues: total === declared ? [] : ["Declared total differs from computed total."],
  };
}
