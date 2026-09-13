import { createClient } from "@/lib/supabase/server";
import DashboardChart from "./DashboardChart";
import Link from "next/link";
import { Flame, Target, BarChart3 } from "lucide-react";

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const { data: attempts } = await supabase
    .from("attempts")
    .select("category, is_correct")
    .eq("user_id", user!.id);

  const total = attempts?.length || 0;
  const correct = attempts?.filter((a) => a.is_correct).length || 0;
  const akurasi = total ? Math.round((correct / total) * 100) : 0;

  const byCategory: Record<string, { correct: number; total: number }> = {};
  (attempts || []).forEach((a) => {
    byCategory[a.category] = byCategory[a.category] || { correct: 0, total: 0 };
    byCategory[a.category].total += 1;
    if (a.is_correct) byCategory[a.category].correct += 1;
  });

  const chartData = Object.entries(byCategory).map(([cat, s]) => ({
    name: CATEGORY_LABEL[cat] || cat,
    akurasi: Math.round((s.correct / s.total) * 100),
  }));

  const sorted = Object.entries(byCategory).sort((a, b) => b[1].correct / b[1].total - a[1].correct / a[1].total);
  const strongest = sorted[0]?.[0];
  const weakest = sorted[sorted.length - 1]?.[0];

  return (
    <main className="px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-voice text-2xl text-ink mb-6">Progress belajar</h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-line rounded-2xl p-5">
            <Flame size={18} className="text-accentRed mb-2" />
            <p className="text-xl font-medium text-ink">{profile?.streak_count || 0} hari</p>
            <p className="text-[12.5px] text-muted">Streak belajar</p>
          </div>
          <div className="bg-white border border-line rounded-2xl p-5">
            <Target size={18} className="text-sage mb-2" />
            <p className="text-xl font-medium text-ink">{total} soal</p>
            <p className="text-[12.5px] text-muted">Total latihan</p>
          </div>
          <div className="bg-white border border-line rounded-2xl p-5">
            <BarChart3 size={18} className="text-sage-dark mb-2" />
            <p className="text-xl font-medium text-ink">{akurasi}%</p>
            <p className="text-[12.5px] text-muted">Akurasi</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="bg-white border border-line rounded-2xl p-6 mb-6">
            <p className="text-[13.5px] font-medium text-ink mb-4">Akurasi per kategori</p>
            <DashboardChart data={chartData} />
          </div>
        )}

        {strongest && weakest && (
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-sage-soft rounded-2xl p-5">
              <p className="text-[12.5px] text-sage-dark">Materi terkuat</p>
              <p className="font-voice text-lg text-sage-dark mt-1">{CATEGORY_LABEL[strongest]}</p>
            </div>
            <div className="bg-accentRed-soft rounded-2xl p-5">
              <p className="text-[12.5px] text-accentRed">Perlu diperbaiki</p>
              <p className="font-voice text-lg text-accentRed mt-1">{CATEGORY_LABEL[weakest]}</p>
            </div>
          </div>
        )}

        {total === 0 && (
          <p className="text-sm text-muted text-center mb-8">
            Belum ada riwayat latihan. Upload materi dulu, lalu mulai latihan pertamamu.
          </p>
        )}

        <div className="flex justify-center gap-3">
          <Link
            href="/practice/setup"
            className="bg-sage text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-sage-dark"
          >
            Latihan Sekarang
          </Link>
          <Link
            href="/upload"
            className="border border-sage text-sage-dark rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-sage-soft"
          >
            Upload Materi Baru
          </Link>
        </div>
      </div>
    </main>
  );
}
