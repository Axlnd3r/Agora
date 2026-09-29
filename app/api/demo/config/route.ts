import { NextResponse } from "next/server";
import { DEMO_PRICE, DEMO_SERVICE, DEMO_SERVICE_ID } from "../../../../lib/demo-payment";
import { DEMO_OWNER, DEMO_VAULT } from "../../../../lib/server/demo-chain";
import { demoReady, demoWallet } from "../../../../lib/server/demo-config";
import { plannerConfig } from "../../../../lib/server/demo-planner";

export function GET() {
  if (!demoReady()) return NextResponse.json({ ready: false, reason: "Demo signers are not configured." });
  const planner = plannerConfig();
  if (!planner.ready) return NextResponse.json({ ready: false, reason: "Live planner is not configured.", planner });
  return NextResponse.json({
    ready: true, owner: DEMO_OWNER, vault: DEMO_VAULT,
    agent: demoWallet("AGENT").address, merchant: demoWallet("MERCHANT").address,
    relayer: demoWallet("RELAYER").address, service: DEMO_SERVICE,
    serviceId: DEMO_SERVICE_ID, priceAtomic: DEMO_PRICE.toString(), planner,
  });
}
