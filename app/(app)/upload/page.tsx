"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload as UploadIcon, FileText, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/Button";

type Stage = "idle" | "uploading" | "extracting" | "categorizing" | "done" | "error";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [itemCount, setItemCount] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const runPipeline = async (file: File) => {
    setFileName(file.name);
    setErrorMsg("");
    setStage("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error);
      const id = uploadJson.upload.id;
      setUploadId(id);

      setStage("extracting");
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: id }),
      });
      const extractJson = await extractRes.json();
      if (!extractRes.ok) throw new Error(extractJson.error);

      setStage("categorizing");
      const catRes = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: id }),
      });
      const catJson = await catRes.json();
      if (!catRes.ok) throw new Error(catJson.error);

      setItemCount(catJson.items?.length || 0);
      setStage("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memproses PDF.");
      setStage("error");
    }
  };

  const onFileChosen = (file: File | null) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorMsg("Hanya file PDF yang didukung.");
      setStage("error");
      return;
    }
    runPipeline(file);
  };

  const stageLabel: Record<Stage, string> = {
    idle: "",
    uploading: "Mengunggah file...",
    extracting: "Mengekstrak teks dari PDF...",
    categorizing: "Mengelompokkan materi dengan AI...",
    done: "Selesai",
    error: "Gagal",
  };

  return (
    <main className="px-8 py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-[13px] text-sage font-medium mb-1">Langkah 1 dari 3</p>
        <h2 className="font-voice text-2xl text-ink mb-1">Upload materi PDF</h2>
        <p className="text-sm text-muted mb-8">
          Sistem akan membaca isi PDF, mengekstrak kotoba, kanji, grammar, dan bacaan.
        </p>

        {stage === "idle" && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFileChosen(e.dataTransfer.files?.[0] || null);
            }}
            className="border-2 border-dashed border-line rounded-2xl p-14 text-center cursor-pointer bg-white hover:border-sage"
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0] || null)}
            />
            <UploadIcon size={28} className="text-sage mx-auto mb-4" />
            <p className="text-sm font-medium text-ink mb-1">Klik untuk memilih file, atau drag and drop</p>
            <p className="text-[13px] text-muted">Maksimal ukuran sesuai batas storage Supabase project kamu</p>
          </div>
        )}

        {stage !== "idle" && (
          <div className="bg-white border border-line rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-3">
              <FileText size={18} className="text-sage-dark" />
              <p className="text-sm font-medium text-ink">{fileName}</p>
            </div>

            {stage !== "done" && stage !== "error" && (
              <div>
                <p className="text-[13px] text-sage-dark mb-2">{stageLabel[stage]}</p>
                <div className="h-1.5 rounded-full bg-beige overflow-hidden">
                  <div className="h-full w-2/3 bg-sage rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {stage === "done" && (
              <div>
                <div className="flex items-center gap-1.5 text-sage-dark mb-4">
                  <CheckCircle2 size={16} />
                  <span className="text-[13px]">Ditemukan {itemCount} materi dari PDF ini</span>
                </div>
                <Button icon={CheckCircle2} onClick={() => router.push(`/verify?uploadId=${uploadId}`)}>
                  Lihat Hasil Ekstraksi
                </Button>
              </div>
            )}

            {stage === "error" && (
              <div>
                <div className="flex items-center gap-1.5 text-accentRed mb-4">
                  <XCircle size={16} />
                  <span className="text-[13px]">{errorMsg}</span>
                </div>
                <Button variant="secondary" onClick={() => setStage("idle")}>
                  Coba Lagi
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
