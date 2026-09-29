"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BSC_TESTNET_CHAIN_ID, shortenAddress } from "../lib/chain";
import { useWallet } from "./wallet-provider";

const links = [
  ["/app", "Overview"], ["/app/setup", "Vault setup"], ["/app/agents", "Agents"], ["/app/mandates", "Mandates"], ["/app/runs/new", "Paid task demo"], ["/app/activity", "Activity"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const wallet = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const walletAction = wallet.address
    ? wallet.chainId === BSC_TESTNET_CHAIN_ID ? `Connected ${shortenAddress(wallet.address)}` : "Switch network"
    : "Connect wallet";
  const connectOrSwitch = () => wallet.address
    ? void wallet.switchToTestnet().catch(() => undefined)
    : void wallet.connect().catch(() => undefined);

  return <div className="app-frame">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="app-topbar">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true" />Agora</Link>
      <span className="testnet-label">BNB Testnet · live contracts</span>
      <button className="app-menu" aria-label={menuOpen ? "Close application navigation" : "Open application navigation"} aria-expanded={menuOpen} aria-controls="app-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
      {wallet.address && <span className="wallet-label" title={wallet.address}>{wallet.chainId === BSC_TESTNET_CHAIN_ID ? shortenAddress(wallet.address) : `Chain ${wallet.chainId ?? "?"}`}</span>}
      <button className="button wallet-action" onClick={connectOrSwitch} disabled={!!wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID} aria-label={wallet.address && wallet.chainId === BSC_TESTNET_CHAIN_ID ? `Connected wallet ${wallet.address}` : walletAction}><span className="wallet-action-desktop">{walletAction}</span><span className="wallet-action-mobile">{wallet.address ? wallet.chainId === BSC_TESTNET_CHAIN_ID ? "Wallet" : "Switch" : "Connect"}</span></button>
    </header>
    <aside id="app-navigation" className={menuOpen ? "app-nav open" : "app-nav"}>
      <nav aria-label="Application navigation">{links.map(([href, label]) => <Link key={href} className={path === href ? "active" : ""} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}</nav>
      <div className="nav-note">One invoice-check service runs through HTTP 402, signed payment, vault settlement, and confirmed delivery. The active planner mode appears on the paid task page.</div>
    </aside>
    <main id="main-content" className="app-content">
      {wallet.error && <p className="form-error wallet-error" role="alert">{wallet.error}</p>}
      {children}
    </main>
  </div>;
}
