import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL, CATEGORIZE_SYSTEM_PROMPT } from "@/lib/anthropic";

// POST /api/categorize — body: { uploadId: string }
// Mengambil raw_text hasil ekstraksi, kirim ke Claude untuk dikelompokkan
// jadi kotoba/kanji/grammar/reading, lalu simpan sebagai extracted_items
// dengan is_verified = false (menunggu verifikasi manual pengguna,
// SESUAI aturan #17 di spesifikasi awal: jangan langsung generate soal).
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { uploadId } = await req.json();

  const { data: upload, error: fetchError } = await supabase
    .from("materials_upload")
    .select("*")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !upload || !upload.raw_text) {
    return NextResponse.json({ error: "Belum ada teks hasil ekstraksi untuk upload ini" }, { status: 400 });
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: CATEGORIZE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: upload.raw_text }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("Respons AI tidak berisi teks");

    const items = JSON.parse(textBlock.text.trim());
    if (!Array.isArray(items)) throw new Error("Format respons AI tidak sesuai (bukan array)");

    const rows = items.map((it: any) => {
      const { category, confidence, ...data } = it;
      return {
        upload_id: uploadId,
        user_id: user.id,
        category,
        data,
        confidence: confidence || "medium",
        is_verified: false,
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from("extracted_items")
      .insert(rows)
      .select();

    if (insertError) throw new Error(insertError.message);

    await supabase.from("materials_upload").update({ status: "done" }).eq("id", uploadId);

    return NextResponse.json({ items: inserted });
  } catch (err: any) {
    await supabase
      .from("materials_upload")
      .update({ status: "error", error_message: err.message })
      .eq("id", uploadId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
