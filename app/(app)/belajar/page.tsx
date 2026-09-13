"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, RotateCcw, LayoutGrid } from "lucide-react";
import Button from "@/components/Button";
import { ExtractedItem } from "@/lib/questionBuilder";

type Card = {
  id: string;
  category: string;
  front: string;
  back: string;
  arti: string;
  contoh?: string;
  contohArti?: string;
  relatedWord?: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BelajarPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sulitCount, setSulitCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/extracted-items?verified=true")
      .then((r) => r.json())
      .then((json) => {
        const items: ExtractedItem[] = json.items || [];
        const built: Card[] = items
          .filter((it) => it.category === "kotoba" || it.category === "kanji")
          .map((it) => ({
            id: it.id,
            category: it.category,
            front: it.data.jp,
            back: it.data.reading || it.data.romaji,
            arti: it.data.arti,
            contoh: it.data.contoh,
            contohArti: it.data.contohArti,
            relatedWord: it.data.relatedWord,
          }));
        setCards(shuffle(built));
        setLoading(false);
      });
  }, []);

  if (loading) return <main className="px-8 py-12 text-center text-sm text-muted">Memuat kartu...</main>;

  if (cards.length === 0) {
    return (
      <main className="px-8 py-16 text-center">
        <p className="text-sm text-muted mb-4">Belum ada materi kotoba/kanji yang terverifikasi.</p>
        <Button onClick={() => router.push("/upload")}>Upload Materi</Button>
      </main>
    );
  }

  const card = cards[index];

  const mark = async (label: "sulit" | "paham") => {
    if (label === "sulit") {
      setSulitCount((n) => n + 1);
      fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractedItemId: card.id, category: card.category }),
      }).catch(() => {});
    }
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  if (done) {
    return (
      <main className="px-8 py-14 text-center">
        <div className="max-w-sm mx-auto">
          <CheckCircle2 size={28} className="text-sage mx-auto mb-4" />
          <h2 className="font-voice text-xl text-ink mb-2">Sesi belajar selesai</h2>
          <p className="text-sm text-muted mb-6">
            {cards.length} kartu dipelajari, {sulitCount} ditandai masih sulit. Materi itu sudah masuk ke "Perlu Diulang".
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              icon={RotateCcw}
              onClick={() => {
                setIndex(0);
                setSulitCount(0);
                setFlipped(false);
                setDone(false);
                setCards((c) => shuffle(c));
              }}
            >
              Ulangi Sesi
            </Button>
            <Button icon={LayoutGrid} onClick={() => router.push("/dashboard")}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-8 py-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[13px] text-muted">
            Kartu {index + 1} dari {cards.length}
          </span>
          {sulitCount > 0 && <span className="text-[12px] text-accentRed">{sulitCount} ditandai sulit</span>}
        </div>

        <div
          onClick={() => setFlipped((f) => !f)}
          className="bg-white border border-line rounded-[20px] p-12 text-center cursor-pointer min-h-[220px] flex flex-col items-center justify-center mb-5"
        >
          {!flipped ? (
            <p className="text-5xl font-voice text-ink">{card.front}</p>
          ) : (
            <div>
              <p className="text-2xl font-voice text-sage-dark mb-2">{card.back}</p>
              <p className="text-lg text-ink mb-3">{card.arti}</p>
              {card.relatedWord && <p className="text-xs text-sage mb-2">Kata terkait: {card.relatedWord}</p>}
              {card.contoh && <p className="text-[13.5px] font-voice text-muted">{card.contoh}</p>}
              {card.contohArti && <p className="text-[12.5px] text-muted mt-1">{card.contohArti}</p>}
            </div>
          )}
        </div>
        <p className="text-center text-[12.5px] text-muted mb-6">
          {flipped ? "Klik kartu untuk kembali" : "Klik kartu untuk lihat jawaban"}
        </p>

        {flipped && (
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" icon={XCircle} onClick={() => mark("sulit")}>
              Masih Sulit
            </Button>
            <Button icon={CheckCircle2} onClick={() => mark("paham")}>
              Saya Sudah Paham
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
