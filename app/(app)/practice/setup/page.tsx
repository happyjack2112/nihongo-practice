"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { usePractice } from "@/lib/PracticeContext";
import { buildQuestions, ExtractedItem } from "@/lib/questionBuilder";

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };
const ALL_TYPES = ["word-to-meaning", "meaning-to-word", "kanji-meaning", "kanji-reading"];

function OptionCard({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`text-center px-3 py-2.5 rounded-lg border cursor-pointer text-[13.5px] font-medium ${
        active ? "border-sage bg-sage-soft text-sage-dark" : "border-line bg-white text-ink"
      }`}
    >
      {label}
    </div>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const { setQuestions } = usePractice();

  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState<number | "all">(10);
  const [categories, setCategories] = useState(["kotoba", "kanji", "grammar", "reading"]);
  const [types, setTypes] = useState(ALL_TYPES);

  useEffect(() => {
    fetch("/api/extracted-items?verified=true")
      .then((r) => r.json())
      .then((json) => {
        setItems(json.items || []);
        setLoading(false);
      });
  }, []);

  const toggleCategory = (c: string) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  const toggleType = (t: string) => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const available = useMemo(
    () => buildQuestions({ items, categories, count: "all", types }),
    [items, categories, types]
  );

  const start = () => {
    setQuestions(buildQuestions({ items, categories, count, types }));
    router.push("/practice/session");
  };

  if (loading) {
    return <main className="px-8 py-12 text-center text-sm text-muted">Memuat bank materi...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="px-8 py-16 text-center">
        <p className="text-sm text-muted mb-4">
          Belum ada materi yang terverifikasi. Upload PDF dan verifikasi dulu materinya.
        </p>
        <Button onClick={() => router.push("/upload")}>Upload Materi</Button>
      </main>
    );
  }

  return (
    <main className="px-8 py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-[13px] text-sage font-medium mb-1">Langkah 3 dari 3</p>
        <h2 className="font-voice text-2xl text-ink mb-1">Atur latihanmu</h2>
        <p className="text-sm text-muted mb-8">Pilih kategori, jumlah, dan jenis soal yang mau kamu kerjakan.</p>

        <p className="text-[12.5px] font-medium text-muted mb-2">JUMLAH SOAL</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[10, 20, 30, "all"].map((n) => (
            <OptionCard key={n} label={n === "all" ? "Semua" : String(n)} active={count === n} onClick={() => setCount(n as any)} />
          ))}
        </div>

        <p className="text-[12.5px] font-medium text-muted mb-2">KATEGORI</p>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {["kotoba", "kanji", "grammar", "reading"].map((c) => (
            <OptionCard key={c} label={CATEGORY_LABEL[c]} active={categories.includes(c)} onClick={() => toggleCategory(c)} />
          ))}
        </div>

        <p className="text-[12.5px] font-medium text-muted mb-2">JENIS SOAL</p>
        <div className="grid grid-cols-2 gap-2 mb-8">
          <OptionCard label="Kata → Arti" active={types.includes("word-to-meaning")} onClick={() => toggleType("word-to-meaning")} />
          <OptionCard label="Arti → Kata" active={types.includes("meaning-to-word")} onClick={() => toggleType("meaning-to-word")} />
          <OptionCard label="Kanji → Arti" active={types.includes("kanji-meaning")} onClick={() => toggleType("kanji-meaning")} />
          <OptionCard label="Kanji → Bacaan" active={types.includes("kanji-reading")} onClick={() => toggleType("kanji-reading")} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted">{available.length} soal tersedia dari materi terpilih</p>
          <Button icon={ChevronRight} disabled={available.length === 0} onClick={start}>
            Mulai Latihan
          </Button>
        </div>
      </div>
    </main>
  );
}
