import { AppShell } from "../../components/app-shell";
import { WalletProvider } from "../../components/wallet-provider";

export default function ApplicationLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <WalletProvider><AppShell>{children}</AppShell></WalletProvider>;
}
