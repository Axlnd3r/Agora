import { randomBytes } from "node:crypto";
import fs from "node:fs";
import { Wallet } from "ethers";

const path = ".env.local";
if (fs.existsSync(path)) throw new Error(`${path} already exists; add demo keys manually or back it up first.`);

const agent = Wallet.createRandom();
const merchant = Wallet.createRandom();
const relayer = Wallet.createRandom();
const internalToken = randomBytes(32).toString("hex");
const config = [
  `AGORA_AGENT_PRIVATE_KEY=${agent.privateKey}`,
  `AGORA_MERCHANT_PRIVATE_KEY=${merchant.privateKey}`,
  `AGORA_RELAYER_PRIVATE_KEY=${relayer.privateKey}`,
  `AGORA_INTERNAL_TOKEN=${internalToken}`,
  "SERVER_RPC_URL=https://bsc-testnet-rpc.publicnode.com",
  "",
].join("\n");
fs.writeFileSync(path, config, { flag: "wx", mode: 0o600 });
console.log(`Agent: ${agent.address}`);
console.log(`Merchant: ${merchant.address}`);
console.log(`Relayer: ${relayer.address}`);
console.log(`Secrets saved in ignored ${path}. Fund only the relayer with tBNB.`);
