import { NextRequest, NextResponse } from "next/server";
import { listDeals, dataSources } from "@/lib/deals-service";
import type { DealStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID: DealStatus[] = ["completed", "announced", "rumored"];

export async function GET(req: NextRequest) {
  const status = (req.nextUrl.searchParams.get("status") ?? "announced") as DealStatus;
  if (!VALID.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  try {
    const deals = await listDeals(status);
    return NextResponse.json({ deals, sources: dataSources() });
  } catch (err) {
    console.error("[api/deals]", err);
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 });
  }
}
