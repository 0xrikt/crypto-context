import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteWallet } from "@/lib/store";
import { validateUUID } from "@/lib/security";

export async function POST(request: NextRequest) {
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

  const walletId = body.walletId as string;
  const idError = validateUUID(walletId);
  if (idError) {
    return NextResponse.json({ error: idError }, { status: 400 });
  }

  try {
    await deleteWallet(walletId, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[wallet/disconnect]", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { error: "Failed to disconnect wallet" },
      { status: 500 }
    );
  }
}
