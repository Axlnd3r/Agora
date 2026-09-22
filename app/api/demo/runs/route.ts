import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { demoRunInputSchema } from "../../../../lib/demo-domain";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = demoRunInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_DEMO_RUN", message: "Add an invoice reference and a task with at least eight characters." } },
      { status: 400 },
    );
  }

  const digest = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex").slice(0, 12);
  return NextResponse.json({
    id: `fixture-${digest}`,
    mode: "fixture",
    stages: ["policy_checked", "quote_verified", "payment_fixture_loaded", "delivery_fixture_loaded"],
  });
}
