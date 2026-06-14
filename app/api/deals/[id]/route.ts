import { NextRequest, NextResponse } from "next/server";
import { findDeal, modelDeal } from "@/lib/deals-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const facts = await findDeal(params.id);
  if (!facts) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  try {
    const result = await modelDeal(facts);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/deals/[id]]", err);
    return NextResponse.json({ error: "Model failed" }, { status: 500 });
  }
}
