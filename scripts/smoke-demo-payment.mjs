import assert from "node:assert/strict";
import fs from "node:fs";
import { Contract, hexlify, JsonRpcProvider, randomBytes, Wallet } from "ethers";
import deployment from "../deployments/bsc-testnet.json" with { type: "json" };
import demo from "../deployments/demo-testnet.json" with { type: "json" };
import { DEMO_PATH, DEMO_SERVICE_ID, parseDemoRequest, runAuthorizationMessage } from "../lib/demo-payment.ts";

function readEnv(path) {
  return Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }));
}

const deployEnv = readEnv(".env.deploy.local");
const demoEnv = readEnv(".env.local");
const owner = new Wallet(deployEnv.DEPLOYER_PRIVATE_KEY);
assert.equal(owner.address, deployment.deployer);
const origin = process.env.DEMO_ORIGIN || "http://127.0.0.1:3100";
const request = parseDemoRequest({
  requestId: hexlify(randomBytes(32)), mandateId: demo.mandateId, vault: demo.vault,
  serviceId: DEMO_SERVICE_ID, task: "Periksa perhitungan invoice ini.",
  invoice: { reference: "INV-DEMO-001", currency: "IDR",
    items: [{ description: "Jasa desain", quantity: "2", unitPriceMinor: "100000" }],
    discountMinor: "0", taxMinor: "0", declaredTotalMinor: "200000" },
});
const provider = new JsonRpcProvider(demoEnv.SERVER_RPC_URL, 97);
const token = new Contract(deployment.contracts.DemoUSD, ["function balanceOf(address) view returns (uint256)"], provider);
const before = await token.balanceOf(demo.merchant);

const challenge = await fetch(new URL(DEMO_PATH, origin), { method: "POST", headers: {
  "Content-Type": "application/json", "x-agora-internal-token": demoEnv.AGORA_INTERNAL_TOKEN,
}, body: JSON.stringify(request) });
assert.equal(challenge.status, 402);
assert.ok(challenge.headers.get("PAYMENT-REQUIRED"));
console.log("Merchant returned HTTP 402 with PAYMENT-REQUIRED.");

const deadline = Math.floor(Date.now() / 1000) + 300;
const authorization = { request, authorizationDeadline: deadline,
  ownerSignature: await owner.signMessage(runAuthorizationMessage(request, deadline)) };
async function run(body) {
  const response = await fetch(new URL("/api/runs", origin), { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  return { status: response.status, data };
}

const first = await run(authorization);
assert.equal(first.status, 200, JSON.stringify(first.data));
assert.equal(first.data.validTotal, true);
assert.equal(first.data.computedTotalMinor, "200000");
assert.equal(first.data.payment.amount, "20000");
assert.equal(first.data.flow.planner.mode, demoEnv.AGORA_PLANNER_MODE || "fixture");
if (first.data.flow.planner.mode === "live") {
  assert.ok(first.data.flow.planner.model);
  console.log(`Live planner: ${first.data.flow.planner.model}${first.data.flow.planner.responseId ? ` (${first.data.flow.planner.responseId})` : ""}`);
}
const after = await token.balanceOf(demo.merchant);
assert.equal(after - before, 20_000n);
console.log(`Payment settled: ${first.data.payment.transaction}`);

const retry = await run(authorization);
assert.equal(retry.status, 200, JSON.stringify(retry.data));
assert.equal(retry.data.payment.transaction, first.data.payment.transaction);
assert.equal(await token.balanceOf(demo.merchant), after);
console.log("Retry returned the same paid result without another transfer.");

const changed = parseDemoRequest({ ...request, invoice: { ...request.invoice, declaredTotalMinor: "200001" } });
const changedDeadline = Math.floor(Date.now() / 1000) + 300;
const conflict = await run({ request: changed, authorizationDeadline: changedDeadline,
  ownerSignature: await owner.signMessage(runAuthorizationMessage(changed, changedDeadline)) });
assert.equal(conflict.status, 409, JSON.stringify(conflict.data));
assert.equal(await token.balanceOf(demo.merchant), after);
console.log("Changed content with the same request ID was rejected.");
