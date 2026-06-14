import { NextRequest, NextResponse } from "next/server";
import { runScreener } from "@/lib/screener-service";
import type { ScreenerQuery } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: ScreenerQuery;
  try {
    body = (await req.json()) as ScreenerQuery;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  try {
    const result = await runScreener(body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/screener]", err);
    return NextResponse.json({ error: "Screener failed" }, { status: 500 });
  }
}
