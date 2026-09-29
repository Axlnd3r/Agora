import fs from "node:fs";
import { Contract, formatEther, formatUnits, JsonRpcProvider, Wallet } from "ethers";
import deployment from "../deployments/bsc-testnet.json" with { type: "json" };

const deployConfig = Object.fromEntries(fs.readFileSync(".env.deploy.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => line.split("=", 2)));
const demoConfig = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((line) => line.split("=", 2)));
const provider = new JsonRpcProvider(demoConfig.SERVER_RPC_URL || deployConfig.BSC_TESTNET_RPC_URL, 97);
const owner = new Wallet(deployConfig.DEPLOYER_PRIVATE_KEY);
if (owner.address !== deployment.deployer) throw new Error("Local deployment wallet does not match the manifest.");
const relayer = new Wallet(demoConfig.AGORA_RELAYER_PRIVATE_KEY);
const token = new Contract(deployment.contracts.DemoUSD, ["function balanceOf(address) view returns (uint256)"], provider);
const [ownerGas, relayerGas, walletTokens, vaultTokens] = await Promise.all([
  provider.getBalance(owner.address), provider.getBalance(relayer.address),
  token.balanceOf(owner.address), token.balanceOf(deployment.contracts.MandateVault),
]);
console.log(`Owner: ${owner.address}`);
console.log(`Owner tBNB: ${formatEther(ownerGas)}`);
console.log(`Relayer: ${relayer.address}`);
console.log(`Relayer tBNB: ${formatEther(relayerGas)}`);
console.log(`Owner mUSD: ${formatUnits(walletTokens, 6)}`);
console.log(`Vault mUSD: ${formatUnits(vaultTokens, 6)}`);
