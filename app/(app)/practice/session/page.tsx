"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, X, ChevronRight } from "lucide-react";
import Button from "@/components/Button";
import { usePractice } from "@/lib/PracticeContext";

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };
const CATEGORY_TEXT: Record<string, string> = { kotoba: "text-sage", kanji: "text-accentRed", grammar: "text-[#B08D57]", reading: "text-[#3E6E82]" };

export default function SessionPage() {
  const router = useRouter();
  const { questions, setResults } = usePractice();
  const [index, setIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [collected, setCollected] = useState<any[]>([]);

  useEffect(() => {
    if (questions.length === 0) router.replace("/practice/setup");
  }, [questions, router]);

  if (questions.length === 0) return null;

  const q = questions[index];
  const progress = (index / questions.length) * 100;

  const submit = (opt: string) => {
    if (answered) return;
    setSelectedOpt(opt);
    setAnswered(true);
  };

  const next = async () => {
    const isCorrect = selectedOpt === q.answer;
    const entry = { ...q, userAnswer: selectedOpt!, correct: isCorrect };

    fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        extractedItemId: q.extractedItemId,
        category: q.category,
        questionSnapshot: q,
        userAnswer: selectedOpt,
        isCorrect,
      }),
    }).catch(() => {}); // catatan: kegagalan pencatatan tidak menghentikan sesi latihan

    const updated = [...collected, entry];
    if (index + 1 >= questions.length) {
      setResults(updated);
      router.push("/practice/result");
    } else {
      setCollected(updated);
      setIndex(index + 1);
      setSelectedOpt(null);
      setAnswered(false);
    }
  };

  return (
    <main className="px-8 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[13px] text-muted">
            Soal {index + 1} dari {questions.length}
          </span>
          <span className={`text-[11.5px] bg-white border border-line px-2.5 py-0.5 rounded-full ${CATEGORY_TEXT[q.category]}`}>
            {CATEGORY_LABEL[q.category]}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-beige mb-8 overflow-hidden">
          <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {q.passage && (
          <div className="bg-beige border border-line rounded-2xl p-5 mb-5 text-left">
            <p className="text-[12px] text-sage font-medium mb-2">{q.passageTitle}</p>
            <p className="text-lg font-voice text-ink leading-8">{q.passage}</p>
          </div>
        )}

        <div className="bg-white border border-line rounded-2xl p-10 text-center mb-6">
          <p className="text-[13.5px] text-muted mb-5">{q.prompt}</p>
          {q.jpDisplay && <p className="text-4xl font-voice text-ink">{q.jpDisplay}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {q.options.map((opt, i) => {
            const isCorrectOpt = opt === q.answer;
            const isChosen = opt === selectedOpt;
            let cls = "border-line bg-white text-ink";
            if (answered && isCorrectOpt) cls = "border-sage bg-sage-soft text-sage-dark";
            else if (answered && isChosen && !isCorrectOpt) cls = "border-accentRed bg-accentRed-soft text-accentRed";
            return (
              <div
                key={i}
                onClick={() => submit(opt)}
                className={`flex items-center justify-center gap-1.5 border rounded-lg px-4 py-3 text-base font-voice cursor-pointer ${cls}`}
              >
                {answered && isCorrectOpt && <Check size={15} />}
                {answered && isChosen && !isCorrectOpt && <X size={15} />}
                {opt}
              </div>
            );
          })}
        </div>

        {answered && (
          <div className={`rounded-xl p-4 mb-6 ${selectedOpt === q.answer ? "bg-sage-soft" : "bg-accentRed-soft"}`}>
            <p className={`text-[13.5px] font-medium mb-1 ${selectedOpt === q.answer ? "text-sage-dark" : "text-accentRed"}`}>
              {selectedOpt === q.answer ? "Benar!" : `Jawaban yang benar: ${q.answer}`}
            </p>
            {q.penjelasan && <p className="text-[13px] text-ink">{q.penjelasan}</p>}
          </div>
        )}

        <div className="flex justify-end">
          <Button icon={ChevronRight} disabled={!answered} onClick={next}>
            {index + 1 >= questions.length ? "Lihat Hasil" : "Soal Berikutnya"}
          </Button>
        </div>
      </div>
    </main>
  );
}
