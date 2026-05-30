import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWallets } from "@/lib/store";
import { fetchWalletPortfolioForChain, type WalletSnapshot } from "@/lib/wallet";

export const maxDuration = 60;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallets = await getWallets(user.id);

  if (wallets.length === 0) {
    return NextResponse.json({ snapshots: [], totalUsdValue: 0 });
  }

  const snapshots: WalletSnapshot[] = [];

  for (const w of wallets) {
    try {
      const snapshot = await fetchWalletPortfolioForChain(w.address, w.chain);
      snapshots.push(snapshot);
    } catch (err) {
      console.error(
        `[wallet/portfolio] Failed: chain=${w.chain} address=${w.address.slice(0, 10)}...`,
        err instanceof Error ? err.message : "unknown"
      );
    }
  }

  const totalUsdValue = snapshots.reduce((sum, s) => sum + s.totalUsdValue, 0);

  return NextResponse.json({ snapshots, totalUsdValue });
}
