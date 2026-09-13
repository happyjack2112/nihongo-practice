// Diporting langsung dari buildQuestions() di prototipe React
// (nihongo-practice.jsx), disesuaikan untuk beroperasi di atas baris
// extracted_items dari Supabase alih-alih data contoh statis.

export type ExtractedItem = {
  id: string;
  category: "kotoba" | "kanji" | "grammar" | "reading";
  data: any;
};

export type Question = {
  id: string;
  extractedItemId: string;
  category: string;
  prompt: string;
  jpDisplay?: string;
  passage?: string;
  passageTitle?: string;
  options: string[];
  answer: string;
  penjelasan?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type BuildOptions = {
  items: ExtractedItem[];
  categories: string[];
  count: number | "all";
  types: string[]; // "word-to-meaning" | "meaning-to-word" | "kanji-meaning" | "kanji-reading"
  onlyIds?: Set<string>; // batasi ke item tertentu (dipakai fitur "Perlu Diulang")
};

export function buildQuestions({ items, categories, count, types, onlyIds }: BuildOptions): Question[] {
  const pool: Question[] = [];
  const byCategory = (cat: string) => items.filter((it) => it.category === cat && (!onlyIds || onlyIds.has(it.id)));

  if (categories.includes("kotoba")) {
    const kotoba = items.filter((it) => it.category === "kotoba");
    byCategory("kotoba").forEach((it) => {
      const m = it.data;
      if (types.includes("word-to-meaning")) {
        const distractors = shuffle(kotoba.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.data.arti);
        pool.push({
          id: it.id + "-w2m",
          extractedItemId: it.id,
          category: "kotoba",
          prompt: "Apa arti dari:",
          jpDisplay: m.jp,
          options: shuffle([m.arti, ...distractors]),
          answer: m.arti,
        });
      }
      if (types.includes("meaning-to-word")) {
        const distractors = shuffle(kotoba.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.data.jp);
        pool.push({
          id: it.id + "-m2w",
          extractedItemId: it.id,
          category: "kotoba",
          prompt: `Bahasa Jepang dari "${m.arti}" adalah:`,
          options: shuffle([m.jp, ...distractors]),
          answer: m.jp,
        });
      }
    });
  }

  if (categories.includes("kanji")) {
    const kanji = items.filter((it) => it.category === "kanji");
    byCategory("kanji").forEach((it) => {
      const m = it.data;
      if (types.includes("kanji-meaning")) {
        const distractors = shuffle(kanji.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.data.arti);
        pool.push({
          id: it.id + "-arti",
          extractedItemId: it.id,
          category: "kanji",
          prompt: "Apa arti dari kanji:",
          jpDisplay: m.jp,
          options: shuffle([m.arti, ...distractors]),
          answer: m.arti,
        });
      }
      if (types.includes("kanji-reading")) {
        const distractors = shuffle(kanji.filter((x) => x.id !== it.id)).slice(0, 3).map((x) => x.data.reading);
        pool.push({
          id: it.id + "-baca",
          extractedItemId: it.id,
          category: "kanji",
          prompt: "Bagaimana cara membaca kanji:",
          jpDisplay: m.jp,
          options: shuffle([m.reading, ...distractors]),
          answer: m.reading,
        });
      }
    });
  }

  if (categories.includes("grammar")) {
    byCategory("grammar").forEach((it) => {
      const m = it.data;
      pool.push({
        id: it.id,
        extractedItemId: it.id,
        category: "grammar",
        prompt: "Lengkapi kalimat:",
        jpDisplay: m.kalimatSoal,
        options: m.opsi,
        answer: m.jawaban,
        penjelasan: m.penjelasan,
      });
    });
  }

  if (categories.includes("reading")) {
    const typeLabel: Record<string, string> = {
      pemahaman: "Pertanyaan pemahaman:",
      kosakata: "Pertanyaan kosakata:",
      "benar-salah": "Benar atau salah:",
    };
    byCategory("reading").forEach((it) => {
      const passage = it.data;
      (passage.questions || []).forEach((q: any, i: number) => {
        pool.push({
          id: `${it.id}-q${i}`,
          extractedItemId: it.id,
          category: "reading",
          passage: passage.text,
          passageTitle: passage.title,
          prompt: typeLabel[q.type] || "Jawab pertanyaan berikut:",
          jpDisplay: q.prompt,
          options: q.options,
          answer: q.answer,
          penjelasan: q.penjelasan,
        });
      });
    });
  }

  const shuffled = shuffle(pool);
  return count === "all" ? shuffled : shuffled.slice(0, Math.min(count, shuffled.length));
}
