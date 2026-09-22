import { NextResponse } from "next/server";
import { demoWorkspace } from "../../../../lib/demo-domain";

export function GET() {
  return NextResponse.json(demoWorkspace, {
    headers: { "Cache-Control": "no-store" },
  });
}
