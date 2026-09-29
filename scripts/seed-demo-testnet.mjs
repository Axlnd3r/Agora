import fs from "node:fs";
import { Contract, hexlify, id, isHexString, JsonRpcProvider, parseEther, randomBytes, Wallet } from "ethers";
import deployment from "../deployments/bsc-testnet.json" with { type: "json" };

function readEnv(path) {
  return Object.fromEntries(fs.readFileSync(path, "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    return [line.slice(0, index), line.slice(index + 1)];
  }));
}

const deployEnv = readEnv(".env.deploy.local");
const demoEnv = readEnv(".env.local");
const provider = new JsonRpcProvider(demoEnv.SERVER_RPC_URL || deployEnv.BSC_TESTNET_RPC_URL, 97);
const owner = new Wallet(deployEnv.DEPLOYER_PRIVATE_KEY, provider);
const agent = new Wallet(demoEnv.AGORA_AGENT_PRIVATE_KEY);
const merchant = new Wallet(demoEnv.AGORA_MERCHANT_PRIVATE_KEY);
const relayer = new Wallet(demoEnv.AGORA_RELAYER_PRIVATE_KEY);
if (owner.address !== deployment.deployer) throw new Error("Owner wallet does not match deployment manifest.");
if ((await provider.getNetwork()).chainId !== 97n) throw new Error("Expected BNB Smart Chain Testnet.");

const statePath = "deployments/demo-testnet.json";
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : {
  chainId: 97, owner: owner.address, vault: deployment.contracts.MandateVault,
  agent: agent.address, merchant: merchant.address, relayer: relayer.address,
  service: "invoice-check:v1", serviceId: id("invoice-check:v1"),
  mandateId: hexlify(randomBytes(32)), transactions: {},
};
if (state.owner !== owner.address || state.vault !== deployment.contracts.MandateVault
  || state.agent !== agent.address || state.merchant !== merchant.address || state.relayer !== relayer.address) {
  throw new Error("Existing demo manifest belongs to different wallets.");
}
if (!isHexString(state.mandateId, 32)) {
  if (state.transactions.createMandate) throw new Error("Cannot repair a mandate ID after its transaction was submitted.");
  state.mandateId = hexlify(randomBytes(32));
}
const save = () => fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
save();

if (await provider.getBalance(relayer.address) < parseEther("0.001")) {
  const tx = await owner.sendTransaction({ to: relayer.address, value: parseEther("0.01") });
  state.transactions.fundRelayer = tx.hash;
  save();
  await tx.wait();
  console.log(`Relayer funded: ${tx.hash}`);
}

const token = new Contract(deployment.contracts.DemoUSD, [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
], owner);
const vault = new Contract(deployment.contracts.MandateVault, [
  "function deposit(uint256)", "function freeBalance() view returns (uint256)",
  "function getMandate(bytes32) view returns ((bytes32 mandateId,address agent,uint256 totalLimit,uint256 dailyLimit,uint256 perPaymentLimit,uint64 validAfter,uint64 validUntil,uint32 maxPayments) config,uint256 spentTotal,uint32 paymentCount,uint8 status)",
  "function createMandate((bytes32 mandateId,address agent,uint256 totalLimit,uint256 dailyLimit,uint256 perPaymentLimit,uint64 validAfter,uint64 validUntil,uint32 maxPayments) config,(address merchant,bytes32 serviceId)[] providers)",
], owner);

const targetDeposit = 100_000_000n;
const currentVaultBalance = await token.balanceOf(deployment.contracts.MandateVault);
if (currentVaultBalance < targetDeposit) {
  const amount = targetDeposit - currentVaultBalance;
  if (await token.balanceOf(owner.address) < amount) throw new Error("Owner wallet lacks mUSD for demo deposit.");
  if (await token.allowance(owner.address, deployment.contracts.MandateVault) < amount) {
    const approve = await token.approve(deployment.contracts.MandateVault, amount);
    state.transactions.approve = approve.hash;
    save();
    await approve.wait();
    console.log(`Token approved: ${approve.hash}`);
  }
  const deposit = await vault.deposit(amount);
  state.transactions.deposit = deposit.hash;
  save();
  await deposit.wait();
  console.log(`Vault funded: ${deposit.hash}`);
}

const existing = await vault.getMandate(state.mandateId);
if (Number(existing.status) === 0) {
  if (await vault.freeBalance() < 10_000_000n) throw new Error("Vault lacks 10 free mUSD for demo mandate.");
  const block = await provider.getBlock("latest");
  if (!block) throw new Error("Latest block is unavailable.");
  const config = { mandateId: state.mandateId, agent: agent.address, totalLimit: 10_000_000n,
    dailyLimit: 1_000_000n, perPaymentLimit: 100_000n,
    validAfter: block.timestamp, validUntil: block.timestamp + 7 * 24 * 60 * 60, maxPayments: 100 };
  const tx = await vault.createMandate(config, [{ merchant: merchant.address, serviceId: state.serviceId }]);
  state.transactions.createMandate = tx.hash;
  save();
  await tx.wait();
  console.log(`Demo mandate created: ${tx.hash}`);
}

console.log(`Demo mandate ID: ${state.mandateId}`);
console.log(`Relayer tBNB: ${await provider.getBalance(relayer.address)}`);
