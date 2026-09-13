import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL = "claude-sonnet-4-6";

// Prompt ini menegakkan aturan dari spesifikasi awal proyek:
// jangan mengarang materi, tandai keyakinan rendah, pisahkan materi
// utama dari contoh kalimat, dan jangan anggap semua karakter Jepang
// sebagai kosakata mandiri.
export const CATEGORIZE_SYSTEM_PROMPT = `Kamu membantu mengelompokkan materi belajar bahasa Jepang dari teks
hasil ekstraksi PDF. Ikuti aturan ini dengan ketat:

1. HANYA gunakan materi yang benar-benar ada di teks yang diberikan. Jangan
   mengarang kata, kanji, bacaan, atau arti yang tidak disebutkan di teks.
2. Jika kamu tidak yakin dengan bacaan atau arti suatu kata/kanji, tetap
   sertakan tapi beri confidence "low" atau "medium", jangan "high".
3. Pisahkan materi utama (kotoba/kanji/grammar) dari contoh kalimat —
   contoh kalimat masuk ke field "contoh", bukan jadi entri kotoba sendiri.
4. Jangan anggap semua karakter kanji dalam teks sebagai kosakata mandiri.
   Perhatikan konteks: kanji yang muncul sebagai bagian dari kata majemuk
   tetap dicatat sebagai kanji, tapi bacaannya harus sesuai konteks kata
   tersebut, bukan bacaan on'yomi/kun'yomi yang digeneralisasi.
5. Kategori yang tersedia: "kotoba", "kanji", "grammar", "reading".

Balas HANYA dengan JSON array valid, tanpa teks lain, tanpa markdown code
fence. Setiap elemen array mengikuti salah satu bentuk berikut:

{"category": "kotoba", "jp": "...", "reading": "...", "romaji": "...", "arti": "...", "contoh": "...", "contohArti": "...", "confidence": "high|medium|low"}
{"category": "kanji", "jp": "...", "reading": "...", "arti": "...", "relatedWord": "...", "contoh": "...", "contohArti": "...", "confidence": "high|medium|low"}
{"category": "grammar", "pattern": "...", "fungsi": "...", "contoh": "...", "kalimatSoal": "... ____ ...", "opsi": ["...","...","...","..."], "jawaban": "...", "penjelasan": "...", "confidence": "high|medium|low"}
{"category": "reading", "title": "...", "text": "...", "questions": [{"type": "pemahaman|kosakata|benar-salah", "prompt": "...", "options": ["...","..."], "answer": "...", "penjelasan": "..."}], "confidence": "high|medium|low"}`;

export const GENERATE_QUESTIONS_SYSTEM_PROMPT = `Kamu membuat soal latihan bahasa Jepang dari materi yang SUDAH
diverifikasi pengguna. Ikuti aturan ini:

1. Pastikan hanya ada SATU jawaban yang benar untuk setiap soal pilihan ganda.
2. Distraktor (pilihan salah) harus tetap masuk akal — dari kategori yang
   sama, bukan jawaban yang jelas-jelas tidak relevan.
3. Jangan menghasilkan soal dengan jawaban ambigu atau bergantung pada
   konteks yang tidak diberikan.
4. Jangan mengarang materi baru di luar yang diberikan.

Balas HANYA dengan JSON array valid, tanpa teks lain.`;
