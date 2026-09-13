"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, CheckCircle2 } from "lucide-react";
import Button from "@/components/Button";
import { usePractice } from "@/lib/PracticeContext";
import { buildQuestions } from "@/lib/questionBuilder";

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };
const CATEGORY_DOT: Record<string, string> = { kotoba: "bg-sage", kanji: "bg-accentRed", grammar: "bg-[#B08D57]", reading: "bg-[#3E6E82]" };

export default function ReviewPage() {
  const router = useRouter();
  const { setQuestions } = usePractice();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((json) => {
        setRows(json.items || []);
        setLoading(false);
      });
  }, []);

  const resolve = async (extractedItemId: string) => {
    await fetch("/api/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extractedItemId }),
    });
    setRows((prev) => prev.filter((r) => r.extracted_item_id !== extractedItemId));
  };

  const grouped: Record<string, any[]> = {};
  rows.forEach((r) => {
    grouped[r.category] = grouped[r.category] || [];
    grouped[r.category].push(r);
  });

  const startReview = () => {
    const items = rows.map((r) => ({ id: r.extracted_items.id, category: r.extracted_items.category, data: r.extracted_items.data }));
    const onlyIds = new Set(items.map((it) => it.id));
    const questions = buildQuestions({
      items,
      categories: Object.keys(grouped),
      count: "all",
      types: ["word-to-meaning", "meaning-to-word", "kanji-meaning", "kanji-reading"],
      onlyIds,
    });
    setQuestions(questions);
    router.push("/practice/session");
  };

  if (loading) return <main className="px-8 py-12 text-center text-sm text-muted">Memuat...</main>;

  if (rows.length === 0) {
    return (
      <main className="px-8 py-16 text-center">
        <CheckCircle2 size={26} className="text-sage mx-auto mb-3" />
        <h2 className="font-voice text-xl text-ink mb-1">Tidak ada yang perlu diulang</h2>
        <p className="text-[13.5px] text-muted mb-6">
          Materi yang sering salah dijawab atau ditandai "masih sulit" akan muncul di sini.
        </p>
        <Button onClick={() => router.push("/practice/setup")}>Mulai Latihan</Button>
      </main>
    );
  }

  return (
    <main className="px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-voice text-2xl text-ink mb-1">Perlu diulang</h2>
        <p className="text-sm text-muted mb-7">
          Materi ini sering salah dijawab atau kamu tandai "masih sulit". Diprioritaskan lebih sering muncul di latihan.
        </p>

        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[cat]}`} />
              <p className="text-[13px] font-medium text-ink">
                {CATEGORY_LABEL[cat]} ({list.length})
              </p>
            </div>
            <div className="bg-white border border-line rounded-xl divide-y divide-line">
              {list.map((r) => {
                const d = r.extracted_items.data;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`font-voice text-ink ${cat === "grammar" || cat === "reading" ? "text-sm" : "text-lg min-w-[60px]"}`}>
                      {d.jp || d.pattern || d.title}
                    </div>
                    <p className="flex-1 text-[13px] text-muted">{d.arti || d.fungsi || `${d.questions?.length || 0} pertanyaan`}</p>
                    <button
                      onClick={() => resolve(r.extracted_item_id)}
                      className="flex items-center gap-1 border border-line rounded-full px-2.5 py-1 text-[12px] text-sage-dark"
                    >
                      <Check size={12} /> Sudah paham
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center mt-4">
          <Button icon={RotateCcw} onClick={startReview}>
            Latihan Materi Ini
          </Button>
        </div>
      </div>
    </main>
  );
}
