import { JsonRpcProvider, Wallet } from "ethers";
import { BSC_TESTNET_RPC } from "../chain";

export function demoReady() {
  return Boolean(process.env.AGORA_AGENT_PRIVATE_KEY && process.env.AGORA_MERCHANT_PRIVATE_KEY && process.env.AGORA_RELAYER_PRIVATE_KEY && process.env.AGORA_INTERNAL_TOKEN);
}

export function demoProvider() {
  return new JsonRpcProvider(process.env.SERVER_RPC_URL || BSC_TESTNET_RPC, 97, { batchMaxCount: 1 });
}

export function demoWallet(kind: "AGENT" | "MERCHANT" | "RELAYER") {
  const key = process.env[`AGORA_${kind}_PRIVATE_KEY`];
  if (!key) throw new Error(`${kind.toLowerCase()} signer is not configured.`);
  return new Wallet(key, demoProvider());
}

export function internalTokenMatches(value: string | null) {
  const expected = process.env.AGORA_INTERNAL_TOKEN;
  return Boolean(expected && value === expected);
}
