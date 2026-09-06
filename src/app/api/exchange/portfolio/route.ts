/**
 * GET /api/exchange/portfolio
 * Fetch fresh portfolio for the authenticated user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collectPortfolio } from "@/lib/context-assembler";
import { portfolioView } from "@/lib/portfolio-view";
import {
  checkRateLimit,
  RATE_LIMITS,
  getClientIp,
} from "@/lib/security";

/** Portfolio fetch can be slow for users with many assets across exchanges */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "exchange/portfolio",
    RATE_LIMITS.portfolioFetch.maxRequests,
    RATE_LIMITS.portfolioFetch.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await collectPortfolio(user.id);
    return NextResponse.json(portfolioView(result.snapshots, result.walletSnapshots, result.statuses), {headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"Could not load portfolio sources. Please retry."}, {status:503});
  }
}
