// Google Gemini API — dipilih karena punya tier gratis yang genuinely
// tanpa kartu kredit dan tanpa perlu isi kredit sama sekali (per akhir
// 2025/2026), berbeda dengan API Claude yang mengharuskan pra-bayar
// kredit sejak awal. Dipakai sebagai pengganti API Claude khusus untuk
// langkah kategorisasi materi supaya seluruh pipeline (baca PDF →
// kelompokkan otomatis) bisa berjalan tanpa biaya apapun.
//
// CATATAN PENTING (September 2026): Google baru saja mengganti sistem
// API key mereka dari format lama "AIza..." (Standard key) ke format
// baru "AQ...." (Authorization key). Kunci baru yang dibuat di AI Studio
// sekarang otomatis berformat AQ. Kunci ini WAJIB dikirim lewat header
// `x-goog-api-key`, bukan lagi lewat query parameter `?key=` seperti
// dokumentasi versi lama — beberapa laporan pengguna menemukan kunci AQ
// gagal (401) kalau dikirim lewat query param di kondisi tertentu, jadi
// kode ini sengaja pakai header sesuai contoh resmi terbaru di
// ai.google.dev/gemini-api/docs/api-key.
//
// Model yang dipakai (gemini-3.1-flash-lite) adalah model "flash-lite"
// stabil per Mei 2026, pengganti gemini-2.5-flash-lite yang dijadwalkan
// dimatikan Google 16 Oktober 2026. Kalau di masa depan model ini juga
// sudah dihentikan, cek nama model terbaru di ai.google.dev/gemini-api/docs/models.

import { CATEGORIZE_SYSTEM_PROMPT } from "./prompts";

const MODEL = "gemini-3.1-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function categorizeWithGemini(rawText: string): Promise<any[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY belum diatur. Buat kunci gratis di aistudio.google.com/apikey (tidak perlu kartu kredit)."
    );
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: CATEGORIZE_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: rawText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API gagal: ${errText}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Respons Gemini tidak berisi teks yang bisa diproses.");
  }

  const items = JSON.parse(text.trim());
  if (!Array.isArray(items)) {
    throw new Error("Format respons Gemini tidak sesuai (bukan array).");
  }
  return items;
}
