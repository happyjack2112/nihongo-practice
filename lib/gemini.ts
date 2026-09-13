// Google Gemini API — dipilih karena punya tier gratis yang genuinely
// tanpa kartu kredit dan tanpa perlu isi kredit sama sekali (per akhir
// 2025/2026), berbeda dengan API Claude yang mengharuskan pra-bayar
// kredit sejak awal. Dipakai sebagai pengganti API Claude khusus untuk
// langkah kategorisasi materi supaya seluruh pipeline (baca PDF →
// kelompokkan otomatis) bisa berjalan tanpa biaya apapun.
//
// Batas gratisnya (per model, bisa berubah — cek ai.google.dev untuk
// angka terbaru): Gemini 2.5 Flash-Lite sekitar 15 request/menit dan
// 1.000 request/hari — jauh lebih dari cukup untuk upload PDF pribadi.

import { CATEGORIZE_SYSTEM_PROMPT } from "./prompts";

const MODEL = "gemini-2.5-flash-lite";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function categorizeWithGemini(rawText: string): Promise<any[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY belum diatur. Buat kunci gratis di aistudio.google.com/apikey (tidak perlu kartu kredit)."
    );
  }

  const response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
