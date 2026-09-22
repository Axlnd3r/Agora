"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["/app", "Overview"], ["/app/setup", "Vault setup"], ["/app/agents", "Agents"], ["/app/mandates", "Mandates"], ["/app/runs/new", "New run"], ["/app/activity", "Activity"],
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [path]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  return <div className="app-frame">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="app-topbar">
      <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true" />Agora</Link>
      <span className="testnet-label">BNB Testnet · fixture data</span>
      <button className="app-menu" aria-label={menuOpen ? "Close application navigation" : "Open application navigation"} aria-expanded={menuOpen} aria-controls="app-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close" : "Menu"}</button>
      <span className="wallet-label">0x71c…e20a</span>
    </header>
    <aside id="app-navigation" className={menuOpen ? "app-nav open" : "app-nav"}>
      <nav aria-label="Application navigation">{links.map(([href, label]) => <Link key={href} className={path === href ? "active" : ""} href={href} onClick={() => setMenuOpen(false)}>{label}</Link>)}</nav>
      <div className="nav-note">This workspace uses synthetic testnet fixtures. It does not connect to a wallet.</div>
    </aside>
    <main id="main-content" className="app-content">{children}</main>
  </div>;
}
