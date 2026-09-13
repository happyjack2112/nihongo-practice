import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/upload — menerima multipart/form-data dengan field "file"
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Belum login" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Tidak ada file yang dikirim" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Hanya file PDF yang didukung" }, { status: 400 });
  }

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(storagePath, file, { contentType: "application/pdf" });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: row, error: insertError } = await supabase
    .from("materials_upload")
    .insert({
      user_id: user.id,
      file_name: file.name,
      storage_path: storagePath,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Catatan: pemicu ekstraksi (panggil /api/extract) sengaja dipisah,
  // bukan dijalankan langsung di sini, supaya upload tetap cepat direspons
  // dan proses berat (OCR/AI) bisa di-retry independen kalau gagal.
  return NextResponse.json({ upload: row });
}
