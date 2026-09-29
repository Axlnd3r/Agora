import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "agora-web", mode: "bsc-testnet-contracts", chainId: 97 });
}
