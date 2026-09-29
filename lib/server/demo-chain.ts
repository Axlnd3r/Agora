import { getAddress, type Log } from "ethers";
import deployment from "../../deployments/bsc-testnet.json";
import { eventProvider, vaultContract, vaultInterface } from "../chain";
import { DEMO_PRICE, DEMO_SERVICE_ID, requestHash, type DemoRequest, type SignedInvoice } from "../demo-payment";
import { demoProvider, demoWallet } from "./demo-config";

export const DEMO_OWNER = deployment.deployer;
export const DEMO_VAULT = deployment.contracts.MandateVault;

export async function requireDemoMandate(request: DemoRequest) {
  if (getAddress(request.vault) !== getAddress(DEMO_VAULT)) throw new Error("This demo uses the deployed testnet vault.");
  const provider = demoProvider();
  const vault = vaultContract(DEMO_VAULT, provider);
  const [owner, token, mandate, allowed] = await Promise.all([
    vault.owner() as Promise<string>, vault.token() as Promise<string>,
    vault.getMandate(request.mandateId),
    vault.isProviderAllowed(request.mandateId, demoWallet("MERCHANT").address, DEMO_SERVICE_ID) as Promise<boolean>,
  ]);
  if (getAddress(owner) !== getAddress(DEMO_OWNER) || getAddress(token) !== getAddress(deployment.contracts.DemoUSD)) throw new Error("Demo vault configuration changed.");
  if (Number(mandate.status) !== 1) throw new Error("Mandate must be active.");
  if (Number(mandate.config.validUntil) <= Math.floor(Date.now() / 1000)) throw new Error("Mandate expired.");
  if (getAddress(mandate.config.agent) !== demoWallet("AGENT").address) throw new Error("Mandate agent does not match the configured demo signer.");
  if (!allowed) throw new Error("The demo merchant and service are not allowed by this mandate.");
  if (BigInt(mandate.config.perPaymentLimit) < DEMO_PRICE) throw new Error("Per-payment cap is below 0.02 mUSD.");
  return { vault, provider, mandate };
}

export type SettledPayment = { transaction: string; invoiceDigest: string; amount: string };

export async function findSettledPayment(request: DemoRequest): Promise<SettledPayment | null> {
  if (getAddress(request.vault) !== getAddress(DEMO_VAULT)) throw new Error("This demo uses the deployed testnet vault.");
  const provider = demoProvider();
  const vault = vaultContract(DEMO_VAULT, provider);
  const merchant = demoWallet("MERCHANT").address;
  const digest: string = await vault.paidRequestDigest(merchant, request.requestId);
  if (/^0x0{64}$/i.test(digest)) return null;

  const created = await eventProvider.getTransactionReceipt(deployment.transactions.createVault);
  if (!created) throw new Error("Vault creation receipt is unavailable.");
  const latest = await eventProvider.getBlockNumber();
  const topic = vaultInterface.getEvent("PaymentSettled")!.topicHash;
  let paymentLog: Log | undefined;
  for (let end = latest; end >= created.blockNumber && !paymentLog; end -= 2_000) {
    const start = Math.max(created.blockNumber, end - 1_999);
    let logs: Log[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        logs = await eventProvider.getLogs({ address: DEMO_VAULT, topics: [topic, null, null, request.requestId], fromBlock: start, toBlock: end });
        break;
      } catch (reason) {
        if (attempt === 2 || !/rate limit|429/i.test(String(reason))) throw reason;
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
    paymentLog = logs.at(-1);
  }
  if (!paymentLog) throw new Error("Payment is recorded on-chain, but its event could not be found.");
  const transaction = await provider.getTransaction(paymentLog.transactionHash);
  const parsed = transaction && vaultInterface.parseTransaction({ data: transaction.data, value: transaction.value });
  const paidInvoice = parsed?.args.invoice ?? parsed?.args[0];
  if (!paidInvoice || String(paidInvoice.requestHash).toLowerCase() !== requestHash(request).toLowerCase()) {
    throw new Error("Request id was already paid for different content.");
  }
  const event = vaultInterface.parseLog(paymentLog);
  if (!event || String(event.args.invoiceDigest).toLowerCase() !== digest.toLowerCase()) throw new Error("Payment proof does not match the vault record.");
  return { transaction: paymentLog.transactionHash, invoiceDigest: digest, amount: String(event.args.amount) };
}

export async function settleInvoice(invoice: SignedInvoice, merchantSignature: string, intent: { mandateId: string; invoiceDigest: string; deadline: bigint }, agentSignature: string) {
  const relayer = demoWallet("RELAYER");
  const vault = vaultContract(DEMO_VAULT, relayer);
  await vault.settlePayment.staticCall(invoice, merchantSignature, intent, agentSignature);
  const tx = await vault.settlePayment(invoice, merchantSignature, intent, agentSignature);
  const receipt = await tx.wait(1);
  if (!receipt || receipt.status !== 1) throw new Error("Settlement transaction was not confirmed.");
  const payment = receipt.logs.map((log: Log) => {
    try { return vaultInterface.parseLog(log); } catch { return null; }
  }).find((event: { name: string } | null) => event?.name === "PaymentSettled");
  if (!payment || String(payment.args.invoiceDigest).toLowerCase() !== intent.invoiceDigest.toLowerCase()) throw new Error("Confirmed receipt lacks the expected PaymentSettled event.");
  return { transaction: tx.hash, amount: invoice.amount.toString(), invoiceDigest: intent.invoiceDigest };
}
