import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getContextDocuments } from "@/lib/store";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = await getContextDocuments(user.id);

  return NextResponse.json({
    documents: docs.map((d) => ({
      dimension: d.dimension,
      content: d.content,
      metadata: d.metadata,
      updatedAt: d.updated_at,
    })),
  });
}
