import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora | Controlled spending for AI agents",
  description:
    "A testnet spending-control layer for AI agents that buy digital services within owner-defined mandates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
