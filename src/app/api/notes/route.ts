/**
 * Strategy notes endpoint (the user's own investment thesis / ideas).
 *
 * GET — return the saved notes for the logged-in user.
 * PUT — save (upsert) the notes.
 *
 * Cookie-authed (dashboard only). The notes are folded into the served context
 * and the GLM investor profile (see lib/context.ts + generators/investor-profile.ts).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrategyNotes, upsertStrategyNotes } from "@/lib/store";

/** Hard cap so the notes stay a reasonable size in prompts + DB. */
const MAX_NOTES_LENGTH = 20_000;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, updatedAt } = await getStrategyNotes(user.id);
    return NextResponse.json({ notes: content, updatedAt });
  } catch {
    return NextResponse.json({ error: "Could not load notes. Please reload to retry." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid request body");
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "`content` must be a string" }, { status: 400 });
  }
  if (body.content.length > MAX_NOTES_LENGTH) {
    return NextResponse.json(
      { error: `Notes too long (max ${MAX_NOTES_LENGTH} characters)` },
      { status: 400 },
    );
  }

  try {
    await upsertStrategyNotes(user.id, body.content);
  } catch (err) {
    console.error("[api/notes] save failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Failed to save notes" }, { status: 500 });
  }

  return NextResponse.json({ notes: body.content });
}
