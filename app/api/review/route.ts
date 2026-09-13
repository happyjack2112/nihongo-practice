import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/review — daftar materi yang perlu diulang milik pengguna,
// diprioritaskan: paling sering salah dulu, lalu paling lama ditambahkan.
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { data, error } = await supabase
    .from("review_queue")
    .select("*, extracted_items(*)")
    .eq("user_id", user.id)
    .eq("resolved", false)
    .order("times_wrong", { ascending: false })
    .order("added_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// POST /api/review — body: { extractedItemId, category }
// Dipakai Mode Belajar saat pengguna menandai kartu "Masih Sulit".
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { extractedItemId, category } = await req.json();

  const { error } = await supabase
    .from("review_queue")
    .upsert(
      {
        user_id: user.id,
        extracted_item_id: extractedItemId,
        category,
        reason: "marked_difficult",
        resolved: false,
        resolved_at: null,
      },
      { onConflict: "user_id,extracted_item_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/review — body: { extractedItemId: string }
// Menandai satu materi sebagai "sudah paham" (dikeluarkan dari antrian).
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { extractedItemId } = await req.json();

  const { error } = await supabase
    .from("review_queue")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("extracted_item_id", extractedItemId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
