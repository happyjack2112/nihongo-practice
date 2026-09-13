// CATATAN: sejak proyek ini beralih ke Gemini (gratis, lihat lib/gemini.ts)
// untuk kategorisasi materi, klien Claude di file ini TIDAK dipakai lagi
// secara default. File ini dibiarkan ada kalau nanti kamu mau memakai
// Claude lagi untuk kualitas kategorisasi yang lebih baik (API Claude
// berbayar, tapi biasanya lebih akurat untuk instruksi terstruktur).

import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-4-6";

export { CATEGORIZE_SYSTEM_PROMPT, GENERATE_QUESTIONS_SYSTEM_PROMPT } from "./prompts";
