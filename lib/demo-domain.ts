import { z } from "zod";

export const demoRunInputSchema = z.object({
  invoiceReference: z.string().trim().min(3).max(80),
  task: z.string().trim().min(8).max(500),
});

export const demoWorkspace = {
  mode: "fixture" as const,
  network: { name: "BNB Smart Chain Testnet", chainId: 97 },
  vault: {
    totalAtomic: "100000000",
    reservedAtomic: "10000000",
    spentAtomic: "20000",
    freeAtomic: "90000000",
  },
  mandate: {
    id: "demo-mandate",
    label: "Invoice verification",
    status: "active" as const,
    service: "Invoice-check API",
    budgetAtomic: "10000000",
    remainingAtomic: "9980000",
  },
  payment: {
    id: "demo-payment",
    amountAtomic: "20000",
    status: "confirmed" as const,
    deliveryStatus: "delivered" as const,
  },
};

export function formatToken(atomic: string, decimals = 6): string {
  const value = BigInt(atomic);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}.00`;
}
