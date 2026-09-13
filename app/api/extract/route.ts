import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runOcrOnPdf } from "@/lib/ocr";
// @ts-ignore — pdf-parse tidak menyediakan tipe yang selalu akurat untuk ESM
import pdfParse from "pdf-parse";

// POST /api/extract — body: { uploadId: string }
// Mengambil file PDF dari storage, mencoba ekstraksi teks native.
// Jika hasilnya kosong/terlalu pendek (indikasi PDF hasil scan), lempar
// ke OCR (lihat catatan di bawah).
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
    let ocrUsed = false;

    // Heuristik sederhana: kalau teks yang berhasil diekstrak sangat sedikit
    // dibanding jumlah halaman, kemungkinan besar ini PDF hasil scan/gambar.
    const looksLikeScan = text.length < 50 * (parsed.numpages || 1);

    if (looksLikeScan) {
      if (!process.env.GOOGLE_CLOUD_VISION_API_KEY) {
        await supabase
          .from("materials_upload")
          .update({
            status: "error",
            error_message:
              "PDF ini sepertinya hasil scan/gambar dan butuh OCR, tapi GOOGLE_CLOUD_VISION_API_KEY belum diatur.",
          })
          .eq("id", uploadId);
        return NextResponse.json(
          { error: "PDF butuh OCR, tapi layanan OCR belum dikonfigurasi." },
          { status: 422 }
        );
      }
      text = await runOcrOnPdf(buffer);
      ocrUsed = true;

      if (!text.trim()) {
        await supabase
          .from("materials_upload")
          .update({
            status: "error",
            error_message: "OCR selesai tapi tidak menemukan teks yang bisa dibaca di PDF ini.",
          })
          .eq("id", uploadId);
        return NextResponse.json({ error: "OCR tidak menemukan teks yang bisa dibaca." }, { status: 422 });
      }
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
