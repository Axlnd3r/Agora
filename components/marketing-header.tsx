"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") { close(); buttonRef.current?.focus(); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="marketing-header">
      <Link className="brand" href="/" aria-label="Agora home"><span className="brand-mark" aria-hidden="true" />Agora</Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="#how-it-works">How it works</a><a href="#security">Security boundary</a><a href="#architecture">Architecture</a>
      </nav>
      <Link className="button header-button" href="/app">Open app</Link>
      <button ref={buttonRef} className="menu-button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
      {open && <nav ref={menuRef} id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
        <a href="#how-it-works" onClick={close}>How it works</a><a href="#security" onClick={close}>Security boundary</a><a href="#architecture" onClick={close}>Architecture</a><Link href="/app" onClick={close}>Open app</Link>
      </nav>}
    </header>
  );
}
