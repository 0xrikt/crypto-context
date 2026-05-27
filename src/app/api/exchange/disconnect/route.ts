/**
 * POST /api/exchange/disconnect
 * Disconnect (delete) an exchange connection.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteConnection } from "@/lib/store";
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

  const { connectionId } = body as { connectionId: string };

  // Validate connectionId format
  const idError = validateUUID(connectionId);
  if (idError) {
    return NextResponse.json({ error: "Invalid connection ID" }, { status: 400 });
  }

  try {
    await deleteConnection(connectionId, user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to disconnect exchange" },
      { status: 500 }
    );
  }
}
