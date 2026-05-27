import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveWallet } from "@/lib/store";
import { isValidEvmAddress, SUPPORTED_CHAINS, type SupportedChain } from "@/lib/chains";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/security";

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(
    ip,
    "wallet/connect",
    RATE_LIMITS.exchangeConnect.maxRequests,
    RATE_LIMITS.exchangeConnect.windowMs
  );
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { address, chain, label } = body as {
    address: string;
    chain: string;
    label?: string;
  };

  if (!address || !isValidEvmAddress(address)) {
    return NextResponse.json(
      { error: "Invalid wallet address. Must be a valid EVM address (0x...)." },
      { status: 400 }
    );
  }

  if (!chain || !SUPPORTED_CHAINS.includes(chain as SupportedChain)) {
    return NextResponse.json(
      { error: `Unsupported chain. Supported: ${SUPPORTED_CHAINS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const id = await saveWallet(
      user.id,
      address,
      chain as SupportedChain,
      (label ?? "").trim().slice(0, 50)
    );
    return NextResponse.json({ id, address: address.toLowerCase(), chain });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("duplicate key") || msg.includes("unique")) {
      return NextResponse.json(
        { error: "This wallet is already connected on this chain." },
        { status: 409 }
      );
    }
    console.error("[wallet/connect]", msg);
    return NextResponse.json(
      { error: "Failed to save wallet. Please try again." },
      { status: 500 }
    );
  }
}
