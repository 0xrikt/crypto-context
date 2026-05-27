import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWallets } from "@/lib/store";
import { fetchWalletPortfolio, type WalletSnapshot } from "@/lib/wallet";
import type { SupportedChain } from "@/lib/chains";

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
      const snapshot = await fetchWalletPortfolio(
        w.address as `0x${string}`,
        w.chain as SupportedChain
      );
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
