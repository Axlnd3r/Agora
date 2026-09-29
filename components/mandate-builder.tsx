"use client";

import Link from "next/link";
import { id, isAddress, keccak256, parseUnits, toUtf8Bytes } from "ethers";
import { FormEvent, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, EXPLORER_BASE, factoryContract, formatMUSD, vaultContract } from "../lib/chain";
import { useWallet } from "./wallet-provider";

export function MandateBuilder() {
  const wallet = useWallet();
  const [agent, setAgent] = useState("");
  const [merchant, setMerchant] = useState("");
  const [service, setService] = useState("");
  const [total, setTotal] = useState("");
  const [daily, setDaily] = useState("");
  const [perPayment, setPerPayment] = useState("");
  const [maxPayments, setMaxPayments] = useState("");
  const [expires, setExpires] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [txHash, setTxHash] = useState("");

  async function useDemoService() {
    setError("");
    try {
      const response = await fetch("/api/demo/config", { cache: "no-store" });
      const config = await response.json();
      if (!config.ready) throw new Error(config.reason || "Demo signers are unavailable.");
      setAgent(config.agent);
      setMerchant(config.merchant);
      setService(config.service);
      setTotal("10");
      setDaily("1");
      setPerPayment("0.10");
      setMaxPayments("100");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load demo signers.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setTxHash("");
    if (!wallet.address || !wallet.signer) { setError("Connect a wallet before creating a mandate."); return; }
    if (wallet.chainId !== BSC_TESTNET_CHAIN_ID) { setError("Switch the wallet to BNB Smart Chain Testnet first."); return; }
    if (!isAddress(agent) || !isAddress(merchant)) { setError("Enter valid agent and merchant wallet addresses."); return; }
    if (!service.trim()) { setError("Enter a service name."); return; }

    let totalLimit: bigint;
    let dailyLimit: bigint;
    let paymentLimit: bigint;
    try {
      totalLimit = parseUnits(total, 6);
      dailyLimit = parseUnits(daily, 6);
      paymentLimit = parseUnits(perPayment, 6);
    } catch {
      setError("Enter mUSD amounts with no more than 6 decimal places.");
      return;
    }
    const paymentCount = Number(maxPayments);
    const validUntil = Math.floor(new Date(expires).getTime() / 1000);
    const chainBlock = await wallet.provider?.getBlock("latest");
    if (!chainBlock) { setError("Could not read the latest BNB Testnet timestamp."); return; }
    const chainNow = chainBlock.timestamp;
    if (totalLimit <= 0n || paymentLimit <= 0n || paymentLimit > dailyLimit || dailyLimit > totalLimit) {
      setError("Limits must be above zero: per payment ≤ daily ≤ total.");
      return;
    }
    if (!Number.isInteger(paymentCount) || paymentCount < 1 || paymentCount > 10_000) {
      setError("Maximum payments must be an integer from 1 to 10,000.");
      return;
    }
    if (!Number.isFinite(validUntil) || validUntil <= chainNow || validUntil > chainNow + 30 * 24 * 60 * 60) {
      setError("Expiry must be in the future and within 30 days.");
      return;
    }

    setPending(true);
    try {
      const factory = factoryContract(wallet.provider ?? wallet.signer);
      const vaultAddress: string = await factory.vaultOf(wallet.address);
      if (vaultAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Create a personal vault and deposit mUSD before adding a mandate.");
      }
      const vault = vaultContract(vaultAddress, wallet.signer);
      const freeBalance: bigint = await vaultContract(vaultAddress, wallet.provider ?? wallet.signer).freeBalance();
      if (totalLimit > freeBalance) throw new Error(`The vault has ${formatMUSD(freeBalance)} mUSD free. Deposit enough to cover this mandate first.`);

      const mandateId = keccak256(toUtf8Bytes(`${wallet.address}:${crypto.randomUUID()}`));
      const serviceId = id(service.trim());
      const config = {
        mandateId,
        agent,
        totalLimit,
        dailyLimit,
        perPaymentLimit: paymentLimit,
        validAfter: chainNow,
        validUntil,
        maxPayments: paymentCount,
      };
      const tx = await vault.createMandate(config, [{ merchant, serviceId }]);
      setTxHash(tx.hash);
      await tx.wait();
      setNotice("Mandate created on-chain and its budget is now reserved.");
      wallet.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The mandate transaction failed.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <div className="page-heading"><div><p className="eyebrow">Create mandate · BNB Testnet</p><h1>Set a real on-chain spending limit.</h1><p>The contract reserves the budget from your free vault balance and allows one merchant/service pair.</p></div></div>
    {!wallet.address && <p className="testnet-banner">Connect a wallet from the top bar before creating a mandate.</p>}
    {wallet.address && wallet.chainId !== BSC_TESTNET_CHAIN_ID && <p className="testnet-banner">Switch your wallet to chain 97 before creating a mandate.</p>}
    <form className="form-panel" onSubmit={(event) => void submit(event)}>
      <p className="eyebrow">Authority</p><h2>Choose the agent and permitted service.</h2>
      <button className="button secondary" type="button" onClick={() => void useDemoService()}>Use configured demo service</button>
      <p className="surface-note">This fills the agent signer, merchant recipient, service name, and example limits for the paid invoice check.</p>
      <label>Agent wallet address<input required value={agent} onChange={(event) => setAgent(event.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} /></label>
      <label>Merchant wallet address<input required value={merchant} onChange={(event) => setMerchant(event.target.value)} placeholder="0x…" autoComplete="off" spellCheck={false} /></label>
      <label>Service name<input required value={service} onChange={(event) => setService(event.target.value)} placeholder="For example: invoice-check API" maxLength={120} /><small>The contract stores a hash of this name, not the readable label.</small></label>
      <p className="eyebrow field-eyebrow">Limits</p>
      <div className="field-grid">
        <label>Total budget<input required type="number" min="0.000001" step="0.000001" inputMode="decimal" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="10"/><small>mUSD</small></label>
        <label>Daily cap<input required type="number" min="0.000001" step="0.000001" inputMode="decimal" value={daily} onChange={(event) => setDaily(event.target.value)} placeholder="2"/><small>mUSD</small></label>
        <label>Per-payment cap<input required type="number" min="0.000001" step="0.000001" inputMode="decimal" value={perPayment} onChange={(event) => setPerPayment(event.target.value)} placeholder="0.50"/><small>mUSD</small></label>
        <label>Maximum payments<input required type="number" min="1" max="10000" step="1" inputMode="numeric" value={maxPayments} onChange={(event) => setMaxPayments(event.target.value)} placeholder="10"/></label>
      </div>
      <label>Expires at<input required type="datetime-local" value={expires} onChange={(event) => setExpires(event.target.value)} /><small>Maximum mandate duration is 30 days. Your browser time is converted to a Unix timestamp.</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {(notice || txHash) && <div className="tx-notice" role="status">{notice || "Transaction submitted to your wallet."} {txHash && <a href={`${EXPLORER_BASE}/tx/${txHash}`} target="_blank" rel="noreferrer">View transaction ↗</a>}</div>}
      <div className="form-actions"><Link className="button secondary" href="/app/mandates">Cancel</Link><button className="button button-light" type="submit" disabled={pending || !wallet.address || wallet.chainId !== BSC_TESTNET_CHAIN_ID}>{pending ? "Waiting for confirmation…" : "Create on-chain mandate"}</button></div>
    </form>
  </>;
}
