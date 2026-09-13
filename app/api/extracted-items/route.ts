import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/extracted-items?uploadId=...   (opsional filter)
// GET /api/extracted-items?verified=true  (untuk ambil bank materi siap-latihan)
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const uploadId = req.nextUrl.searchParams.get("uploadId");
  const verifiedOnly = req.nextUrl.searchParams.get("verified") === "true";

  let query = supabase.from("extracted_items").select("*").eq("user_id", user.id);
  if (uploadId) query = query.eq("upload_id", uploadId);
  if (verifiedOnly) query = query.eq("is_verified", true).eq("is_included", true);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

// POST /api/extracted-items — tambah materi manual (dari tombol "Tambah materi")
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { category, data, uploadId } = await req.json();

  const { data: row, error } = await supabase
    .from("extracted_items")
    .insert({
      user_id: user.id,
      upload_id: uploadId || null,
      category,
      data,
      confidence: "medium",
      is_verified: false,
      is_included: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: row });
}

// PATCH /api/extracted-items — body: { id, data?, confidence?, is_verified?, is_included? }
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { id, ...patch } = await req.json();
  patch.updated_at = new Date().toISOString();

  const { data: row, error } = await supabase
    .from("extracted_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: row });
}

// DELETE /api/extracted-items?id=...
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  const { error } = await supabase.from("extracted_items").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
