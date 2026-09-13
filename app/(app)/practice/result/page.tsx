"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, LayoutGrid } from "lucide-react";
import Button from "@/components/Button";
import { usePractice } from "@/lib/PracticeContext";

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };

export default function ResultPage() {
  const router = useRouter();
  const { results, setQuestions } = usePractice();

  useEffect(() => {
    if (results.length === 0) router.replace("/practice/setup");
  }, [results, router]);

  if (results.length === 0) return null;

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const score = Math.round((correct / total) * 100);
  const wrong = results.filter((r) => !r.correct);

  const byCategory: Record<string, { correct: number; total: number }> = {};
  results.forEach((r) => {
    byCategory[r.category] = byCategory[r.category] || { correct: 0, total: 0 };
    byCategory[r.category].total += 1;
    if (r.correct) byCategory[r.category].correct += 1;
  });

  const retryWrong = () => {
    setQuestions(wrong.map(({ userAnswer, correct, ...q }) => q));
    router.push("/practice/session");
  };

  return (
    <main className="px-8 py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-[13px] text-muted mb-1">Hasil latihan</p>
          <p className="text-5xl font-voice text-sage-dark">{score}</p>
          <p className="text-[13px] text-muted mt-1">
            {correct} benar, {total - correct} salah dari {total} soal
          </p>
        </div>

        <div className="grid gap-2.5 mb-8" style={{ gridTemplateColumns: `repeat(${Object.keys(byCategory).length}, 1fr)` }}>
          {Object.entries(byCategory).map(([cat, s]) => (
            <div key={cat} className="bg-white border border-line rounded-xl p-4 text-center">
              <p className="text-[12px] text-muted">{CATEGORY_LABEL[cat]}</p>
              <p className="text-xl font-medium text-ink mt-1">{Math.round((s.correct / s.total) * 100)}%</p>
            </div>
          ))}
        </div>

        {wrong.length > 0 && (
          <div className="mb-8">
            <p className="text-[13px] font-medium text-ink mb-2">Perlu diulang</p>
            <div className="bg-white border border-line rounded-xl divide-y divide-line">
              {wrong.map((w, i) => (
                <div key={i} className="flex justify-between items-center px-4 py-3">
                  <span className="text-base font-voice text-ink">{w.jpDisplay || w.prompt}</span>
                  <span className="text-[13px] text-sage-dark">{w.answer}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] text-muted mt-2">
              Materi ini sudah otomatis masuk ke "Perlu Diulang" — bisa dilihat kapan saja lewat menu navigasi.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {wrong.length > 0 && (
            <Button variant="secondary" icon={RotateCcw} onClick={retryWrong}>
              Ulangi yang Salah
            </Button>
          )}
          <Button icon={LayoutGrid} onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
