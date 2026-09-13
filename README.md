# Nihongo Practice — Kerangka Full-Stack (Tahap B)

Kerangka backend nyata untuk melanjutkan prototipe React
(`nihongo-practice.jsx`) yang sudah dibuat di tahap A.

## Stack

- **Next.js** (App Router, TypeScript) — frontend + API routes
- **Supabase** — database Postgres, auth, dan storage file PDF
- **Google Gemini API** — kategorisasi materi (GRATIS, tanpa kartu kredit —
  lihat `lib/gemini.ts`; API Claude/Anthropic masih tersedia sebagai opsi
  berbayar di `lib/anthropic.ts` kalau nanti ingin kualitas lebih tinggi)
- **pdf-parse** — ekstraksi teks PDF native
- **OCR** (Google Cloud Vision, opsional & berbayar) — untuk PDF hasil scan

## Setup

1. **Buat project di [supabase.com](https://supabase.com)**, lalu:
   - Buka SQL Editor, jalankan isi `supabase/schema.sql` (ini juga membuat
     trigger yang otomatis mengisi tabel `profiles` saat ada pengguna daftar)
   - Buka Storage, buat bucket baru bernama `materials` (private, bukan public)
   - Buka Authentication → Providers, pastikan "Email" aktif (biasanya
     sudah default aktif)
   - Buka Authentication → URL Configuration, tambahkan
     `http://localhost:3000/auth/callback` ke Redirect URLs (untuk
     konfirmasi email saat development)
   - Salin URL dan API key dari Project Settings → API (pakai yang
     "Legacy anon, service_role API keys" — bukan format baru
     publishable/secret — supaya kompatibel dengan versi `@supabase/supabase-js`
     di proyek ini)

2. **Buat API key Gemini gratis (wajib untuk kategorisasi materi):**
   - Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   - Login dengan akun Google, klik "Create API key"
   - Tidak perlu kartu kredit maupun isi saldo apapun
   - Ada batas rate limit harian (lihat komentar di `lib/gemini.ts`), tapi
     jauh lebih dari cukup untuk pemakaian pribadi
   - **Catatan (September 2026):** Google baru mengganti format kunci
     dari `AIza...` ke `AQ....` — kalau kunci kamu diawali `AQ.` itu
     normal, bukan salah. Kode di `lib/gemini.ts` sudah disesuaikan untuk
     format baru ini (dikirim lewat header `x-goog-api-key`, bukan query
     param `?key=` seperti versi lama).

3. **Salin `.env.example` jadi `.env.local`** dan isi:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   GOOGLE_GEMINI_API_KEY=...
   ```
   (`ANTHROPIC_API_KEY` boleh dikosongkan — tidak dipakai kecuali kamu
   sengaja beralih balik ke Claude, lihat `lib/anthropic.ts`)

4. **(Opsional, untuk OCR PDF hasil scan) Aktifkan Google Cloud Vision API:**
   - Buat project di [Google Cloud Console](https://console.cloud.google.com)
   - Aktifkan "Cloud Vision API"
   - Buat API key di Credentials, isi ke `GOOGLE_CLOUD_VISION_API_KEY`
   - Vision API berbayar setelah kuota gratis bulanan habis — cek
     [harga terbaru](https://cloud.google.com/vision/pricing) sebelum
     dipakai untuk banyak PDF. Kalau tidak diisi, upload PDF hasil scan
     akan gagal dengan pesan error yang jelas, tapi PDF teks biasa (bukan
     hasil scan) tetap berfungsi normal tanpa ini.

5. **Install dependency & jalankan:**
   ```bash
   npm install
   npm run dev
   ```

## Struktur folder

```
app/
  page.tsx            → landing page publik
  login/               → halaman masuk & daftar (email/password)
  auth/callback/       → menyelesaikan konfirmasi email / magic link
  (app)/               → route group terproteksi (semua butuh login)
    layout.tsx          → cek auth, render TopNav, redirect ke /login
    dashboard/          → statistik dari attempts & review_queue
    upload/              → upload PDF nyata (upload → extract → categorize)
    verify/              → verifikasi/edit/hapus/tambah materi (Supabase asli)
    belajar/             → Mode Belajar (flashcard), "masih sulit" → review_queue
    practice/
      layout.tsx          → bungkus dengan PracticeProvider (context)
      setup/               → pilih kategori/jumlah/jenis soal
      session/             → tampilkan soal, catat tiap jawaban ke /api/attempts
      result/              → skor & breakdown, tombol ulangi yang salah
      review/              → "Perlu Diulang" (di dalam grup practice biar bisa
                              langsung isi ulang PracticeProvider dan lanjut
                              ke /practice/session)
  api/
    upload/, extract/, categorize/  → pipeline PDF → extracted_items
    extracted-items/                → CRUD materi (dipakai halaman verify)
    attempts/                       → catat jawaban
    review/                         → GET/POST/PATCH antrian "Perlu Diulang"
components/
  Button.tsx, TopNav.tsx, SignOutButton.tsx
lib/
  supabase/client.ts, server.ts   → klien Supabase (browser & server)
  anthropic.ts                     → klien Claude (opsional, tidak dipakai default)
  gemini.ts                        → klien Gemini (GRATIS) + kategorisasi materi
  prompts.ts                       → prompt kategorisasi & generate soal (dipakai gemini.ts & anthropic.ts)
  questionBuilder.ts                → logic pembuatan soal (dipakai client-side)
  PracticeContext.tsx               → state soal & hasil dibagi antar halaman /practice/*
middleware.ts                      → refresh sesi Supabase Auth tiap request
supabase/
  schema.sql                       → skema tabel, RLS, trigger review_queue & profiles
```

## Alur data (mengikuti pipeline dari spesifikasi awal)

```
Upload PDF → POST /api/upload
           → POST /api/extract    (raw_text tersimpan)
           → POST /api/categorize (extracted_items tersimpan, is_verified=false)
Verifikasi → pengguna edit/hapus/tambah lewat /api/extracted-items,
             lalu set is_verified=true saat klik "Lanjutkan"
Latihan    → buildQuestions() dari lib/questionBuilder.ts, dari extracted_items
             terverifikasi (fetch client-side lewat /api/extracted-items?verified=true)
           → tiap jawaban → POST /api/attempts
           → salah otomatis masuk review_queue (lewat trigger database)
Mode Belajar → "Masih Sulit" → POST /api/review (reason: marked_difficult)
Perlu Diulang → GET /api/review, PATCH /api/review untuk "sudah paham",
                atau lanjut latihan lewat PracticeContext yang sama

```

## Status pengerjaan

- ✅ Auth (login/daftar, proteksi halaman, sign out)
- ✅ Upload PDF nyata (native text via `pdf-parse`; fallback OCR via
  Google Cloud Vision untuk PDF hasil scan — lihat `lib/ocr.ts`)
- ✅ Verifikasi materi (edit/hapus/tambah untuk kotoba, kanji, grammar;
  reading hanya edit judul & teks, penambahan passage baru belum didukung
  di UI)
- ✅ Setup & sesi latihan, generate soal dari `questionBuilder.ts`
- ✅ Hasil latihan + catat ke `attempts`
- ✅ Mode Belajar (flashcard)
- ✅ Perlu Diulang, terhubung otomatis dari jawaban salah maupun "masih sulit"
- ✅ Dashboard dengan statistik nyata dari database
- ✅ Streak belajar (trigger database, lihat `fn_update_streak_on_attempt`
  di `schema.sql`)

## Batasan yang jujur perlu diketahui

- **Refresh halaman saat sesi latihan berlangsung akan membuang progres
  soal saat ini** — `PracticeContext` hanya state di memori, belum
  disimpan ke `sessionStorage`/database. Kalau ini penting, tambahkan
  persist state ke `sessionStorage` di `PracticeContext.tsx`.
- **Validasi form grammar di halaman verify pakai `alert()` browser**,
  bukan pesan inline seperti di prototipe — cukup untuk fungsi, tapi
  kurang halus secara UX.
- **Menambah passage reading baru** belum didukung di UI verifikasi
  (hanya edit judul/teks passage yang sudah ada dari hasil ekstraksi AI).
- **Streak dihitung berdasarkan tanggal UTC**, bukan zona waktu lokal
  pengguna. Untuk yang latihan larut malam dekat pergantian hari, streak
  bisa terasa "meleset satu hari" dibanding jam lokalnya. Perbaikannya:
  simpan preferensi zona waktu per pengguna di `profiles`, lalu pakai itu
  di trigger `fn_update_streak_on_attempt` alih-alih UTC polos.
- **OCR bergantung pada paket `canvas` (native binary)** lewat
  `pdf-img-convert` untuk merasterisasi halaman PDF jadi gambar sebelum
  dikirim ke Vision API. Ini biasanya beres di Vercel, tapi kalau kamu
  deploy ke platform lain dan menemui error build/runtime terkait
  `canvas`, itu tandanya platform tersebut tidak menyediakan native
  dependency itu. Alternatif kalau ini jadi masalah: pindah ke Google
  Document AI (menerima PDF langsung tanpa rasterisasi manual) atau
  jalankan di container/VM biasa alih-alih serverless murni.
- **Vision API berbayar** setelah kuota gratis bulanan habis — untuk
  PDF dalam jumlah banyak, ini bisa jadi biaya berulang yang perlu
  dipantau. (Kategorisasi materi via Gemini tetap gratis — hanya OCR
  untuk PDF hasil scan yang berbayar.)

## Yang belum diimplementasikan (perlu keputusan/kerja tambahan)

- **Generate soal grammar/reading via AI**: saat ini soal kotoba/kanji
  dibuat otomatis dari data terverifikasi lewat `questionBuilder.ts`
  (tidak perlu panggil AI lagi tiap latihan). Untuk grammar/reading yang
  strukturnya lebih kompleks, AI generate soalnya sekali saat kategorisasi
  — perlu diuji apakah kualitasnya cukup atau butuh prompt terpisah.

## Kalau kamu sudah pernah menjalankan schema.sql sebelumnya

Trigger streak (`fn_update_streak_on_attempt`) dan trigger review_queue
sama-sama ditulis pakai `create or replace function` dan
`drop trigger if exists` / `create trigger`, jadi aman dijalankan ulang
di project Supabase yang sudah ada — tidak akan menghapus data yang
sudah tersimpan.
