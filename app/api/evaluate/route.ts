import { NextRequest, NextResponse } from "next/server";
import { evaluateCustomDeal } from "@/lib/deals-service";
import type { ModelAssumptions } from "@/lib/types";

export const dynamic = "force-dynamic";

interface EvaluateRequest {
  acquirerSymbol?: string;
  targetSymbol?: string;
  assumptions?: Partial<ModelAssumptions>;
}

const MAX_BODY_BYTES = 8 * 1024;

/** Coerce a user-supplied ticker into a safe symbol (uppercase, bounded). */
function cleanSymbol(s: unknown): string {
  return String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9.\-]/g, "")
    .slice(0, 12);
}

export async function POST(req: NextRequest) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Expected application/json" }, { status: 415 });
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Body too large" }, { status: 413 });
  }

  let body: EvaluateRequest;
  try {
    body = (await req.json()) as EvaluateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const acquirer = cleanSymbol(body.acquirerSymbol);
  const target = cleanSymbol(body.targetSymbol);
  if (!acquirer || !target) {
    return NextResponse.json(
      { error: "Both acquirerSymbol and targetSymbol are required" },
      { status: 400 },
    );
  }
  if (acquirer === target) {
    return NextResponse.json(
      { error: "Acquirer and target must be different companies" },
      { status: 400 },
    );
  }

  try {
    const result = await evaluateCustomDeal(acquirer, target, body.assumptions);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/evaluate]", err);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
