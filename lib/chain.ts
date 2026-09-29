import { Contract, Interface, JsonRpcProvider, zeroPadValue, type Provider, type ContractRunner, type Log } from "ethers";
import deployment from "../deployments/bsc-testnet.json";
import demoDeployment from "../deployments/demo-testnet.json";

export const BSC_TESTNET_CHAIN_ID = 97;
export const BSC_TESTNET_HEX_CHAIN_ID = "0x61";
export const BSC_TESTNET_RPC = "https://bsc-testnet-rpc.publicnode.com";
export const BSC_TESTNET_EVENT_RPC = "https://bnb-testnet.api.onfinality.io/public";
export const EXPLORER_BASE = "https://testnet.bscscan.com";
export const contracts = deployment.contracts;
export const deploymentTransactions = deployment.transactions;
export const sourceVerification = deployment.sourceVerification;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const tokenAbi = [
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function faucet()",
  "function nextFaucetAt(address account) view returns (uint256)",
  "function FAUCET_AMOUNT() view returns (uint256)",
];

export const factoryAbi = [
  "function vaultOf(address owner) view returns (address)",
  "function createVault() returns (address)",
  "event VaultCreated(address indexed owner, address indexed vault, address token)",
];

export const vaultAbi = [
  "function owner() view returns (address)",
  "function token() view returns (address)",
  "function freeBalance() view returns (uint256)",
  "function reservedRemaining() view returns (uint256)",
  "function deposit(uint256 amount)",
  "function withdrawFree(uint256 amount, address recipient)",
  "function createMandate((bytes32 mandateId,address agent,uint256 totalLimit,uint256 dailyLimit,uint256 perPaymentLimit,uint64 validAfter,uint64 validUntil,uint32 maxPayments) config,(address merchant,bytes32 serviceId)[] providers)",
  "function getMandate(bytes32 mandateId) view returns ((bytes32 mandateId,address agent,uint256 totalLimit,uint256 dailyLimit,uint256 perPaymentLimit,uint64 validAfter,uint64 validUntil,uint32 maxPayments) config,uint256 spentTotal,uint32 paymentCount,uint8 status)",
  "function pauseMandate(bytes32 mandateId)",
  "function resumeMandate(bytes32 mandateId)",
  "function revokeMandate(bytes32 mandateId)",
  "function closeExpiredMandate(bytes32 mandateId)",
  "function isProviderAllowed(bytes32 mandateId,address merchant,bytes32 serviceId) view returns (bool)",
  "function paidRequestDigest(address merchant,bytes32 requestId) view returns (bytes32)",
  "function hashInvoice((bytes32 invoiceId,bytes32 requestId,bytes32 mandateId,bytes32 serviceId,bytes32 requestHash,address vault,address token,address merchant,uint256 amount,uint64 validUntil) invoice) view returns (bytes32)",
  "function hashIntent((bytes32 mandateId,bytes32 invoiceDigest,uint64 deadline) intent) view returns (bytes32)",
  "function settlePayment((bytes32 invoiceId,bytes32 requestId,bytes32 mandateId,bytes32 serviceId,bytes32 requestHash,address vault,address token,address merchant,uint256 amount,uint64 validUntil) invoice,bytes merchantSignature,(bytes32 mandateId,bytes32 invoiceDigest,uint64 deadline) intent,bytes agentSignature) returns (bytes32)",
  "event Deposited(address indexed owner, uint256 amount)",
  "event Withdrawn(address indexed recipient, uint256 amount)",
  "event MandateCreated(bytes32 indexed mandateId,address indexed agent,uint256 totalLimit,uint256 dailyLimit,uint256 perPaymentLimit,uint64 validAfter,uint64 validUntil,uint32 maxPayments)",
  "event ProviderAllowed(bytes32 indexed mandateId,address indexed merchant,bytes32 indexed serviceId)",
  "event MandateStatusChanged(bytes32 indexed mandateId,uint8 status,uint256 releasedAmount)",
  "event PaymentSettled(bytes32 indexed mandateId,bytes32 indexed invoiceId,bytes32 indexed requestId,address agent,address merchant,bytes32 serviceId,bytes32 invoiceDigest,bytes32 intentDigest,uint256 amount,uint256 totalSpent,uint256 dailySpent,uint256 utcDay)",
];

export const factoryInterface = new Interface(factoryAbi);
export const vaultInterface = new Interface(vaultAbi);
export const chainReadProvider = new JsonRpcProvider(BSC_TESTNET_RPC, 97, { batchMaxCount: 1 });
export const eventProvider = new JsonRpcProvider(BSC_TESTNET_EVENT_RPC, 97, { batchMaxCount: 1 });

async function readEventLogs(address: string, topics: (string | string[] | null)[], fromBlock: number) {
  const latest = await eventProvider.getBlockNumber();
  const logs: Log[] = [];
  const ranges: { fromBlock: number; toBlock: number }[] = [];
  for (let start = fromBlock; start <= latest; start += 10_000) {
    ranges.push({ fromBlock: start, toBlock: Math.min(start + 9_999, latest) });
  }
  for (let index = 0; index < ranges.length; index += 5) {
    const batches = await Promise.all(ranges.slice(index, index + 5).map((range) => eventProvider.getLogs({ address, topics, ...range })));
    logs.push(...batches.flat());
  }
  return logs;
}

export function tokenContract(runner: ContractRunner) {
  return new Contract(contracts.DemoUSD, tokenAbi, runner);
}

export function factoryContract(runner: ContractRunner) {
  return new Contract(contracts.VaultFactory, factoryAbi, runner);
}

export function vaultContract(address: string, runner: ContractRunner) {
  return new Contract(address, vaultAbi, runner);
}

export function formatMUSD(value: bigint | string) {
  const raw = (BigInt(value) / 1_000_000n).toString();
  const remainder = (BigInt(value) % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return remainder ? `${raw}.${remainder}` : raw;
}

export function shortenAddress(value: string) {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function explorerTx(hash: string) {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function explorerAddress(address: string) {
  return `${EXPLORER_BASE}/address/${address}`;
}

export async function getVaultForOwner(provider: Provider, owner: string) {
  const factory = factoryContract(provider);
  const address: string = await factory.vaultOf(owner);
  if (address.toLowerCase() === ZERO_ADDRESS) return null;

  if (owner.toLowerCase() === deployment.deployer.toLowerCase() && address.toLowerCase() === contracts.MandateVault.toLowerCase()) {
    const receipt = await eventProvider.getTransactionReceipt(demoDeployment.transactions.deposit);
    if (receipt) return { address, fromBlock: receipt.blockNumber };
  }

  let fromBlock = 0;
  const factoryReceipt = await eventProvider.getTransactionReceipt(deploymentTransactions.VaultFactory);
  if (factoryReceipt) fromBlock = factoryReceipt.blockNumber;
  const topic = factoryInterface.getEvent("VaultCreated")!.topicHash;
  const logs = await readEventLogs(contracts.VaultFactory, [topic, zeroPadValue(owner, 32)], fromBlock);

  return { address, fromBlock: logs.at(-1)?.blockNumber ?? fromBlock };
}

export async function getVaultEvents(vaultAddress: string, fromBlock: number) {
  const names = ["Deposited", "Withdrawn", "MandateCreated", "ProviderAllowed", "MandateStatusChanged", "PaymentSettled"];
  const logs = await readEventLogs(vaultAddress, [names.map((name) => vaultInterface.getEvent(name)!.topicHash)], fromBlock);

  return logs.map((log) => ({ ...log, parsed: vaultInterface.parseLog(log) })).sort((a, b) => b.blockNumber - a.blockNumber);
}
