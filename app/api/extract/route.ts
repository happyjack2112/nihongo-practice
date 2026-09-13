import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-ignore — pdf-parse tidak menyediakan tipe yang selalu akurat untuk ESM
import pdfParse from "pdf-parse";

// POST /api/extract — body: { uploadId: string }
// Mengambil file PDF dari storage, mencoba ekstraksi teks native.
// CATATAN: OCR untuk PDF hasil scan (via pdf-img-convert + Google Vision)
// sempat diimplementasikan tapi DIHAPUS karena pdf-img-convert bergantung
// pada paket `canvas` (native binary) yang gagal di-build di Vercel
// (error node-pre-gyp saat npm install). Untuk saat ini, PDF hasil scan
// akan mendapat pesan error yang jelas alih-alih dicoba OCR. Alternatif
// yang lebih serverless-friendly untuk dicoba nanti: Google Document AI
// (menerima PDF langsung tanpa rasterisasi manual) atau @napi-rs/canvas
// (canvas berbasis prebuilt binary, berpotensi lebih kompatibel).
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

  if (fetchError || !upload) {
    return NextResponse.json({ error: "Upload tidak ditemukan" }, { status: 404 });
  }

  await supabase.from("materials_upload").update({ status: "extracting" }).eq("id", uploadId);

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from("materials")
      .download(upload.storage_path);
    if (downloadError || !fileBlob) throw new Error(downloadError?.message || "Gagal mengunduh file");

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const parsed = await pdfParse(buffer);
    let text = parsed.text.trim();
    const ocrUsed = false;

    // Heuristik sederhana: kalau teks yang berhasil diekstrak sangat sedikit
    // dibanding jumlah halaman, kemungkinan besar ini PDF hasil scan/gambar.
    const looksLikeScan = text.length < 50 * (parsed.numpages || 1);

    if (looksLikeScan) {
      await supabase
        .from("materials_upload")
        .update({
          status: "error",
          error_message:
            "PDF ini sepertinya hasil scan/gambar. OCR belum didukung saat ini — coba upload PDF dengan teks yang bisa diseleksi/copy langsung (bukan hasil scan).",
        })
        .eq("id", uploadId);
      return NextResponse.json(
        { error: "PDF ini sepertinya hasil scan/gambar dan belum bisa dibaca otomatis. Coba PDF dengan teks asli." },
        { status: 422 }
      );
    }

    await supabase
      .from("materials_upload")
      .update({ status: "categorizing", raw_text: text, ocr_used: ocrUsed })
      .eq("id", uploadId);

    return NextResponse.json({ text, ocrUsed, pages: parsed.numpages });
  } catch (err: any) {
    await supabase
      .from("materials_upload")
      .update({ status: "error", error_message: err.message })
      .eq("id", uploadId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
