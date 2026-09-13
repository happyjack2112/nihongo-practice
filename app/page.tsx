import Link from "next/link";
import { Upload, Sparkles, BookOpen, PenLine, TrendingUp, FileText, CheckCircle2, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const features = [
  { icon: Upload, label: "Upload PDF" },
  { icon: Sparkles, label: "Soal Otomatis" },
  { icon: BookOpen, label: "Latihan Kotoba" },
  { icon: PenLine, label: "Latihan Kanji" },
  { icon: TrendingUp, label: "Tracking Progress" },
];

export default async function LandingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-bg">
      <div className="relative overflow-hidden text-center px-8 pt-20 pb-16">
        <div
          aria-hidden
          className="absolute -top-10 right-[6%] text-[260px] leading-none text-sage-soft font-voice select-none"
        >
          学
        </div>
        <div className="relative max-w-xl mx-auto">
          <h1 className="font-voice text-4xl text-ink mb-4 leading-tight">
            Belajar Bahasa Jepang dari Materimu Sendiri
          </h1>
          <p className="text-muted text-base leading-relaxed mb-9">
            Upload PDF materi belajar dan ubah menjadi latihan interaktif untuk menguasai Kotoba,
            Kanji, Bunpou, dan Reading.
          </p>
          <div className="flex gap-3 justify-center mb-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-sage text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-sage-dark"
            >
              <Upload size={16} /> Mulai Upload Materi
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-sage text-sage-dark rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-sage-soft"
            >
              <PenLine size={16} /> Mulai Latihan
            </Link>
          </div>
          <div className="flex gap-2.5 justify-center flex-wrap">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-line text-[13px] text-sage-dark"
              >
                <f.icon size={14} />
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-8 pb-20 grid gap-4 sm:grid-cols-3">
        {[
          { icon: FileText, title: "Upload materimu", desc: "PDF kotoba, kanji, grammar, atau bacaan — sistem membaca dan mengelompokkannya otomatis." },
          { icon: CheckCircle2, title: "Verifikasi dulu", desc: "Kamu cek dan koreksi hasil ekstraksi sebelum dijadikan soal — tidak ada materi yang dikarang." },
          { icon: Target, title: "Latihan adaptif", desc: "Materi yang sering salah akan lebih sering muncul lagi di sesi berikutnya." },
        ].map((c) => (
          <div key={c.title} className="bg-white border border-line rounded-2xl p-6">
            <c.icon size={20} className="text-sage mb-3" />
            <p className="font-medium text-sm text-ink mb-1">{c.title}</p>
            <p className="text-[13.5px] text-muted leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
