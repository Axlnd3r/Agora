import fs from "node:fs";
import path from "node:path";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";

const configPath = ".env.deploy.local";
const manifestPath = path.join("deployments", "bsc-testnet.json");
const chainId = 97n;

if (!fs.existsSync(configPath)) {
  throw new Error(`Missing ${configPath}. Create a test wallet first.`);
}
if (fs.existsSync(manifestPath)) {
  throw new Error(`${manifestPath} already exists; refusing to deploy duplicates.`);
}

const config = Object.fromEntries(
  fs.readFileSync(configPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1)];
    }),
);

const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? config.DEPLOYER_PRIVATE_KEY;
const rpcUrl = process.env.BSC_TESTNET_RPC_URL ?? config.BSC_TESTNET_RPC_URL;
if (!privateKey || !rpcUrl) throw new Error("Deployment key or testnet RPC URL is missing.");

const provider = new JsonRpcProvider(rpcUrl);
const network = await provider.getNetwork();
if (network.chainId !== chainId) {
  throw new Error(`Wrong network: expected chain ${chainId}, received ${network.chainId}.`);
}

const signer = new Wallet(privateKey, provider);
const balance = await provider.getBalance(signer.address);
if (balance === 0n) throw new Error(`No tBNB in deployer wallet ${signer.address}.`);

const manifest = {
  network: "BNB Smart Chain Testnet",
  chainId: Number(chainId),
  deployer: signer.address,
  startedAt: new Date().toISOString(),
  status: "in_progress",
  contracts: {},
  transactions: {},
};

function saveManifest() {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function deployArtifact(name, args = []) {
  const artifact = JSON.parse(fs.readFileSync(path.join("artifacts", "contracts", `${name}.json`), "utf8"));
  const contract = await new ContractFactory(artifact.abi, artifact.bytecode, signer).deploy(...args);
  const transaction = contract.deploymentTransaction();
  if (!transaction) throw new Error(`${name} deployment transaction was not created.`);
  console.log(`${name} tx: ${transaction.hash}`);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  manifest.contracts[name] = address;
  manifest.transactions[name] = transaction.hash;
  saveManifest();
  console.log(`${name}: ${address}`);
  return contract;
}

saveManifest();
console.log(`Deployer: ${signer.address} (${balance} wei tBNB)`);

const token = await deployArtifact("DemoUSD");
const factory = await deployArtifact("VaultFactory", [await token.getAddress()]);

const vaultTx = await factory.createVault();
console.log(`createVault tx: ${vaultTx.hash}`);
const vaultReceipt = await vaultTx.wait();
const vaultEvent = vaultReceipt.logs
  .map((log) => {
    try {
      return factory.interface.parseLog(log);
    } catch {
      return null;
    }
  })
  .find((event) => event?.name === "VaultCreated");
if (!vaultEvent) throw new Error("VaultCreated event was not found in the confirmed receipt.");
manifest.contracts.MandateVault = vaultEvent.args.vault;
manifest.transactions.createVault = vaultTx.hash;
saveManifest();

const faucetTx = await token.faucet();
console.log(`mUSD faucet tx: ${faucetTx.hash}`);
await faucetTx.wait();
manifest.transactions.mUSDFaucet = faucetTx.hash;
manifest.demoBalance = "100 mUSD";
manifest.status = "complete";
manifest.completedAt = new Date().toISOString();
saveManifest();

console.log(`MandateVault: ${manifest.contracts.MandateVault}`);
console.log(`DemoUSD balance: ${manifest.demoBalance} at ${signer.address}`);
console.log(`Manifest: ${manifestPath}`);
