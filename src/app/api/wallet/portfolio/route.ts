import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collectWalletPortfolio } from "@/lib/context-assembler";

export const maxDuration = 60;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { snapshots, statuses } = await collectWalletPortfolio(user.id);
    return NextResponse.json({
      snapshots,
      totalUsdValue: snapshots.reduce((sum, s) => sum + s.totalUsdValue, 0),
      statuses,
      incomplete: statuses.some(s => s.status !== "live") || snapshots.some(s => s.holdings.some(h => h.usdValue === null)),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load wallet sources. Please retry." }, { status: 503 });
  }
}
