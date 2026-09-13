// OCR untuk PDF hasil scan/gambar. Pendekatannya:
//   1. Rasterisasi tiap halaman PDF jadi gambar PNG di memori
//      (pakai pdf-img-convert, dibangun di atas pdf.js — tanpa perlu
//      binary Poppler terpisah, tapi TETAP bergantung pada paket
//      `canvas` di baliknya untuk merender halaman).
//   2. Kirim tiap gambar ke Google Cloud Vision (DOCUMENT_TEXT_DETECTION)
//      dengan languageHints "ja" supaya prioritas membaca teks Jepang.
//   3. Gabungkan hasil teks tiap halaman.
//
// CATATAN PENTING SOAL DEPLOY: paket `canvas` yang dipakai pdf-img-convert
// butuh native binary (Cairo). Ini biasanya BERES di Vercel (mereka
// menyediakan build image dengan dependency ini), tapi kalau kamu deploy
// ke platform serverless lain dan menemui error saat build/runtime terkait
// `canvas`, itu tandanya platform tersebut tidak menyediakan native
// dependency itu — solusinya pindah ke Node runtime penuh (bukan edge),
// pakai container/VM biasa, atau ganti ke Document AI (Google) yang
// menerima PDF langsung tanpa perlu rasterisasi di sisi kita.

import pdf2img from "pdf-img-convert";

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

export async function runOcrOnPdf(buffer: Buffer): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY belum diatur di environment.");
  }

  const pageImages = (await pdf2img.convert(buffer, {
    base64: false,
  })) as Uint8Array[];

  if (pageImages.length === 0) {
    throw new Error("Gagal merasterisasi halaman PDF menjadi gambar.");
  }

  const pageTexts: string[] = [];

  for (let i = 0; i < pageImages.length; i++) {
    const base64Image = Buffer.from(pageImages[i]).toString("base64");

    const response = await fetch(`${VISION_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["ja"] },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Vision API gagal di halaman ${i + 1}: ${errText}`);
    }

    const json = await response.json();
    if (json.responses?.[0]?.error) {
      throw new Error(`Google Vision API error di halaman ${i + 1}: ${json.responses[0].error.message}`);
    }

    const text = json.responses?.[0]?.fullTextAnnotation?.text || "";
    pageTexts.push(text);
  }

  return pageTexts.join("\n\n");
}
