"use client";

import Link from "next/link";
import { parseUnits } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, EXPLORER_BASE, factoryContract, formatMUSD, tokenContract, vaultContract } from "../lib/chain";
import { ContractVerification } from "./contract-verification";
import { useWallet } from "./wallet-provider";

type Snapshot = { walletBalance: bigint; vaultAddress: string | null; vaultBalance: bigint; free: bigint; reserved: bigint; allowance: bigint; nextFaucetAt: bigint };

export function VaultFundingPanel({ setup = false }: { setup?: boolean }) {
  const wallet = useWallet();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [amount, setAmount] = useState("20");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [txHash, setTxHash] = useState("");

  const load = useCallback(async () => {
    if (!wallet.provider || !wallet.address || wallet.chainId !== BSC_TESTNET_CHAIN_ID) {
      setSnapshot(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = tokenContract(wallet.provider);
      const factory = factoryContract(wallet.provider);
      const [walletBalance, nextFaucetAt, vaultAddress] = await Promise.all([
        token.balanceOf(wallet.address) as Promise<bigint>,
        token.nextFaucetAt(wallet.address) as Promise<bigint>,
        factory.vaultOf(wallet.address) as Promise<string>,
      ]);
      let vaultBalance = 0n;
      let free = 0n;
      let reserved = 0n;
      let allowance = 0n;
      let activeVault: string | null = null;
      if (vaultAddress !== "0x0000000000000000000000000000000000000000") {
        activeVault = vaultAddress;
        const vault = vaultContract(vaultAddress, wallet.provider);
        [vaultBalance, free, reserved, allowance] = await Promise.all([
          token.balanceOf(vaultAddress) as Promise<bigint>,
          vault.freeBalance() as Promise<bigint>,
          vault.reservedRemaining() as Promise<bigint>,
          token.allowance(wallet.address, vaultAddress) as Promise<bigint>,
        ]);
      }
      setSnapshot({ walletBalance, vaultAddress: activeVault, vaultBalance, free, reserved, allowance, nextFaucetAt });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not read the deployed testnet contracts.");
    } finally {
      setLoading(false);
    }
  }, [wallet.address, wallet.chainId, wallet.provider]);

  useEffect(() => { void load(); }, [load, wallet.refreshVersion]);

  async function send(label: string, action: () => Promise<{ hash: string; wait: () => Promise<unknown> }>) {
    setPending(label);
    setError("");
    setNotice("");
    setTxHash("");
    try {
      const tx = await action();
      setTxHash(tx.hash);
      await tx.wait();
      setNotice(`${label} confirmed on BNB Testnet.`);
      wallet.refresh();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The wallet transaction failed.");
    } finally {
      setPending("");
    }
  }

  async function claimFaucet() {
    if (!wallet.signer) return;
    await send("mUSD faucet", () => tokenContract(wallet.signer!).faucet());
  }

  async function createVault() {
    if (!wallet.signer) return;
    await send("Vault creation", () => factoryContract(wallet.signer!).createVault());
  }

  async function deposit() {
    if (!wallet.signer || !snapshot?.vaultAddress) return;
    try {
      const value = parseUnits(amount, 6);
      if (value <= 0n) throw new Error("Enter a deposit amount above zero.");
      if (value > snapshot.walletBalance) throw new Error("Wallet mUSD balance is lower than the deposit amount.");
      setPending("Deposit");
      setError("");
      setNotice("");
      setTxHash("");
      const token = tokenContract(wallet.signer);
      if (snapshot.allowance < value) {
        const approval = await token.approve(snapshot.vaultAddress, value);
        setTxHash(approval.hash);
        await approval.wait();
      }
      const depositTx = await vaultContract(snapshot.vaultAddress, wallet.signer).deposit(value);
      setTxHash(depositTx.hash);
      await depositTx.wait();
      setNotice("Deposit confirmed in your vault.");
      wallet.refresh();
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Deposit failed. Check the wallet and try again.");
    } finally {
      setPending("");
    }
  }

  async function withdraw() {
    if (!wallet.signer || !wallet.address || !snapshot?.vaultAddress) return;
    let value: bigint;
    try { value = parseUnits(amount, 6); } catch { setError("Enter a valid mUSD withdrawal amount with no more than 6 decimal places."); return; }
    if (value <= 0n) { setError("Enter a withdrawal amount above zero."); return; }
    if (value > snapshot.free) { setError("Withdrawal amount exceeds your free vault balance."); return; }
    await send("Withdrawal", () => vaultContract(snapshot.vaultAddress!, wallet.signer!).withdrawFree(value, wallet.address!));
  }

  const title = setup ? "Prepare a live testnet vault" : "Your testnet balances";

  return <>
    {setup && <div className="page-heading"><div><p className="eyebrow">Vault setup</p><h1>{title}</h1><p>Connect your wallet, get demo mUSD, then create and fund a personal vault. Every action below is sent to BNB Smart Chain Testnet.</p></div></div>}
    {!setup && <div className="page-heading dashboard-heading"><div><p className="eyebrow">Workspace overview</p><h1>Manage your testnet vault.</h1><p>Balances and vault state are read from the deployed contracts on BNB Smart Chain Testnet.</p></div><div className="heading-actions"><Link className="button button-light" href="/app/mandates/new">Create a mandate</Link><Link className="button secondary" href="/app/activity">View activity</Link></div></div>}
    <div className="testnet-banner"><strong>Live testnet.</strong> mUSD is a test token with no monetary value. Contract actions require wallet approval and tBNB for gas.</div>
    <ContractVerification />
    {!wallet.address && <section className="state-panel"><p className="eyebrow">Wallet needed</p><h2>Connect a wallet to read your vault.</h2><p>Agora reads your balances directly from the deployed BSC Testnet contracts. No demo account or fixture state is used.</p><button className="button button-light" onClick={() => void wallet.connect().catch(() => undefined)}>Connect wallet</button></section>}
    {wallet.address && wallet.chainId !== BSC_TESTNET_CHAIN_ID && <section className="state-panel"><p className="eyebrow">Wrong network</p><h2>Switch to BNB Smart Chain Testnet.</h2><p>The connected wallet is on chain {wallet.chainId ?? "unknown"}. Contract reads and transactions are paused until it switches to chain 97.</p><button className="button button-light" onClick={() => void wallet.switchToTestnet().catch(() => undefined)}>Switch network</button></section>}
    {wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID && <>
      {loading && !snapshot && <section className="state-panel" aria-live="polite"><span className="state-loader" aria-hidden="true"/><p className="eyebrow">Reading BNB Testnet</p><h2>Loading on-chain balances.</h2></section>}
      {error && !snapshot && <section className="state-panel error-state" role="alert"><p className="eyebrow">Contract read failed</p><h2>Vault data could not load.</h2><p>The public BNB Testnet RPC did not return the vault balances. Try the read again.</p><button className="button button-light" disabled={loading} onClick={() => void load()}>{loading ? "Reading balances…" : "Retry balance read"}</button><details className="error-details"><summary>Technical details</summary><code>{error}</code></details></section>}
      {error && snapshot && <p className="form-error" role="alert">Could not refresh the balances. <button type="button" onClick={() => void load()}>Retry</button></p>}
      {snapshot && <>
        <section className="balance-panel motion-surface" aria-label="Live testnet balances">
          <div><p className="eyebrow">In your wallet</p><h2>{formatMUSD(snapshot.walletBalance)} mUSD</h2><p>{wallet.address}</p></div>
          <dl><div><dt>In vault</dt><dd>{formatMUSD(snapshot.vaultBalance)} mUSD</dd></div><div><dt>Free to withdraw</dt><dd>{formatMUSD(snapshot.free)} mUSD</dd></div><div><dt>Reserved by mandates</dt><dd>{formatMUSD(snapshot.reserved)} mUSD</dd></div></dl>
        </section>
        <section className="workspace-grid">
          <div className="surface"><div className="surface-head"><div><p className="eyebrow">Personal vault</p><h2>{snapshot.vaultAddress ? "Deployed" : "Not created yet"}</h2></div>{snapshot.vaultAddress && <a href={`${EXPLORER_BASE}/address/${snapshot.vaultAddress}`} target="_blank" rel="noreferrer">View contract ↗</a>}</div>
            <p className="surface-note">{snapshot.vaultAddress ? <code>{snapshot.vaultAddress}</code> : "Create your vault from the connected wallet. The factory deploys one vault per owner."}</p>
            {!snapshot.vaultAddress && <button className="button button-light" disabled={!!pending} onClick={() => void createVault()}>{pending === "Vault creation" ? "Waiting for wallet…" : "Create my vault"}</button>}
            {snapshot.vaultAddress && <>
              <label className="amount-field">Amount<input inputMode="decimal" type="number" min="0.000001" step="0.000001" value={amount} onChange={(event) => setAmount(event.target.value)} aria-label="mUSD transaction amount"/><span>mUSD</span></label>
              <div className="inline-actions"><button className="button button-light" disabled={!!pending || !amount} onClick={() => void deposit()}>{pending === "Deposit" ? "Depositing…" : "Approve & deposit"}</button><button className="button secondary" disabled={!!pending || !amount || snapshot.free === 0n} onClick={() => void withdraw()}>{pending === "Withdrawal" ? "Withdrawing…" : "Withdraw free funds"}</button></div>
            </>}
          </div>
          <div className="surface attention"><p className="eyebrow">DemoUSD faucet</p><h2>Get test mUSD</h2><p>The on-chain faucet mints 100 mUSD to this wallet. It allows one claim every 24 hours.</p><button className="button secondary" disabled={!!pending || snapshot.nextFaucetAt > BigInt(Math.floor(Date.now() / 1000))} onClick={() => void claimFaucet()}>{pending === "mUSD faucet" ? "Claiming…" : snapshot.nextFaucetAt > BigInt(Math.floor(Date.now() / 1000)) ? `Available ${new Date(Number(snapshot.nextFaucetAt) * 1000).toLocaleString()}` : "Claim 100 mUSD"}</button></div>
        </section>
      </>}
    </>}
    {(notice || txHash) && <div className="tx-notice" role="status">{notice || (pending ? `${pending} transaction submitted.` : "Transaction submitted.")} {txHash && <a href={`${EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}</div>}
  </>;
}
