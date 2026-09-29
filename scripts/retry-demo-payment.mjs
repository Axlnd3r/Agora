import assert from "node:assert/strict";
import fs from "node:fs";
import { Interface, JsonRpcProvider, Wallet } from "ethers";
import artifact from "../artifacts/contracts/MandateVault.json" with { type: "json" };
import deployment from "../deployments/bsc-testnet.json" with { type: "json" };
import demo from "../deployments/demo-testnet.json" with { type: "json" };
import { DEMO_SERVICE_ID, parseDemoRequest, requestHash, runAuthorizationMessage } from "../lib/demo-payment.ts";

const transactionHash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(transactionHash || "")) throw new Error("Pass a confirmed settlement transaction hash.");
const readEnv = (path) => Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const deployEnv = readEnv(".env.deploy.local");
const demoEnv = readEnv(".env.local");
const provider = new JsonRpcProvider(demoEnv.SERVER_RPC_URL, 97, { batchMaxCount: 1 });
const transaction = await provider.getTransaction(transactionHash);
if (!transaction || transaction.to?.toLowerCase() !== deployment.contracts.MandateVault.toLowerCase()) throw new Error("Not a transaction to the demo vault.");
const parsed = new Interface(artifact.abi).parseTransaction({ data: transaction.data, value: transaction.value });
if (parsed?.name !== "settlePayment") throw new Error("Not a settlement transaction.");
const invoice = parsed.args.invoice;
const requestBody = {
  requestId: invoice.requestId, mandateId: demo.mandateId, vault: demo.vault, serviceId: DEMO_SERVICE_ID,
  invoice: { reference: "INV-DEMO-001", currency: "IDR", items: [{ description: "Jasa desain", quantity: "2", unitPriceMinor: "100000" }],
    discountMinor: "0", taxMinor: "0", declaredTotalMinor: "200000" },
};
const task = process.argv.slice(3).join(" ") || "Periksa perhitungan invoice ini.";
const request = [parseDemoRequest({ ...requestBody, task }), parseDemoRequest(requestBody)]
  .find((candidate) => requestHash(candidate).toLowerCase() === invoice.requestHash.toLowerCase());
if (!request) throw new Error("The transaction request cannot be reconstructed. Pass the original task after the hash.");
const owner = new Wallet(deployEnv.DEPLOYER_PRIVATE_KEY);
const authorizationDeadline = Math.floor(Date.now() / 1000) + 300;
const response = await fetch(new URL("/api/runs", process.env.DEMO_ORIGIN || "http://127.0.0.1:3100"), {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ request, authorizationDeadline, ownerSignature: await owner.signMessage(runAuthorizationMessage(request, authorizationDeadline)) }),
});
const body = await response.json();
assert.equal(response.status, 200, JSON.stringify(body));
assert.equal(body.payment.transaction, transactionHash);
assert.equal(body.flow.recoveredFromChain, true);
console.log(`Recovered the existing payment without a new transfer: ${transactionHash}`);
