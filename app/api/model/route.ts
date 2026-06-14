import { NextRequest, NextResponse } from "next/server";
import { findDeal, modelDeal } from "@/lib/deals-service";
import type { ModelAssumptions } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ModelRequest {
  dealId: string;
  assumptions?: Partial<ModelAssumptions>;
}

// The legitimate body is tiny (a dealId + nine numeric assumptions). Reject
// anything that isn't JSON or is implausibly large before buffering/parsing it.
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }
  const declaredLen = Number(req.headers.get("content-length") ?? 0);
  if (declaredLen > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Body too large" }, { status: 413 });
  }

  let body: ModelRequest;
  try {
    body = (await req.json()) as ModelRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.dealId) {
    return NextResponse.json({ error: "dealId required" }, { status: 400 });
  }
  const facts = await findDeal(body.dealId);
  if (!facts) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  try {
    const result = await modelDeal(facts, body.assumptions);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/model]", err);
    return NextResponse.json({ error: "Model failed" }, { status: 500 });
  }
}
