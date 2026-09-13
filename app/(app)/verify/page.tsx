"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2, Check, X, Plus, ChevronRight } from "lucide-react";
import Button from "@/components/Button";

type Item = {
  id: string;
  category: "kotoba" | "kanji" | "grammar" | "reading";
  data: any;
  confidence: "low" | "medium" | "high";
  is_included: boolean;
};

const CATEGORY_LABEL: Record<string, string> = { kotoba: "Kotoba", kanji: "Kanji", grammar: "Grammar", reading: "Reading" };
const CATEGORY_DOT: Record<string, string> = { kotoba: "bg-sage", kanji: "bg-accentRed", grammar: "bg-[#B08D57]", reading: "bg-[#3E6E82]" };

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const uploadId = params.get("uploadId");

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    const url = uploadId ? `/api/extracted-items?uploadId=${uploadId}` : "/api/extracted-items";
    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        setItems(json.items || []);
        setLoading(false);
      });
  }, [uploadId]);

  const grouped: Record<string, Item[]> = {};
  items.forEach((it) => {
    grouped[it.category] = grouped[it.category] || [];
    grouped[it.category].push(it);
  });

  const patchItem = async (id: string, patch: any) => {
    const res = await fetch("/api/extracted-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const json = await res.json();
    setItems((prev) => prev.map((it) => (it.id === id ? json.item : it)));
  };

  const deleteItem = async (id: string) => {
    await fetch(`/api/extracted-items?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = async (category: string) => {
    const blank =
      category === "grammar"
        ? { pattern: "", fungsi: "", contoh: "", kalimatSoal: "", opsi: ["", "", "", ""], jawaban: "", penjelasan: "" }
        : category === "reading"
          ? null // penambahan passage baru belum didukung di halaman ini
          : { jp: "", reading: "", arti: "" };
    if (blank === null) return;

    const res = await fetch("/api/extracted-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, data: blank, uploadId }),
    });
    const json = await res.json();
    setItems((prev) => [...prev, json.item]);
    setEditingId(json.item.id);
    setDraft(blank);
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setDraft({ ...item.data });
  };

  const saveEdit = async (item: Item) => {
    if (item.category === "grammar") {
      const opsi = (draft.opsi || []).map((o: string) => o.trim());
      if (!draft.pattern?.trim() || !draft.kalimatSoal?.trim() || opsi.some((o: string) => !o)) {
        alert("Pola, kalimat soal, dan semua 4 pilihan harus diisi.");
        return;
      }
      if (new Set(opsi).size !== opsi.length) {
        alert("Pilihan jawaban tidak boleh ada yang sama.");
        return;
      }
      if (!opsi.includes(draft.jawaban?.trim())) {
        alert("Jawaban benar harus salah satu dari 4 pilihan.");
        return;
      }
      await patchItem(item.id, { data: { ...draft, opsi, jawaban: draft.jawaban.trim() }, confidence: "high" });
    } else {
      await patchItem(item.id, { data: draft, confidence: "high" });
    }
    setEditingId(null);
  };

  const continueToSetup = async () => {
    await Promise.all(
      items
        .filter((it) => it.is_included)
        .map((it) => fetch("/api/extracted-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: it.id, is_verified: true }),
        }))
    );
    router.push("/practice/setup");
  };

  if (loading) {
    return <main className="px-8 py-12 text-center text-sm text-muted">Memuat hasil ekstraksi...</main>;
  }

  const includedCount = items.filter((it) => it.is_included).length;

  return (
    <main className="px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-[13px] text-sage font-medium mb-1">Langkah 2 dari 3</p>
        <h2 className="font-voice text-2xl text-ink mb-1">Verifikasi hasil ekstraksi</h2>
        <p className="text-sm text-muted mb-7">
          Cek materi yang berhasil diekstrak dari PDF. Hapus yang salah, dan pilih mana yang mau dijadikan soal.
        </p>

        {Object.keys(grouped).length === 0 && (
          <p className="text-sm text-muted mb-6">Belum ada materi. Upload PDF dulu di halaman Upload Materi.</p>
        )}

        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[cat]}`} />
              <p className="text-[13px] font-medium text-ink">
                {CATEGORY_LABEL[cat]} ({list.length})
              </p>
            </div>
            <div className="bg-white border border-line rounded-xl overflow-hidden divide-y divide-line">
              {list.map((it) =>
                editingId === it.id ? (
                  <EditRow
                    key={it.id}
                    category={it.category}
                    draft={draft}
                    setDraft={setDraft}
                    onCancel={() => setEditingId(null)}
                    onSave={() => saveEdit(it)}
                  />
                ) : (
                  <ViewRow
                    key={it.id}
                    item={it}
                    onToggle={() => patchItem(it.id, { is_included: !it.is_included })}
                    onEdit={() => startEdit(it)}
                    onDelete={() => deleteItem(it.id)}
                  />
                )
              )}
            </div>
            {cat !== "reading" && (
              <button
                onClick={() => addItem(cat)}
                className="flex items-center gap-1.5 mt-2 text-[13px] text-sage-dark"
              >
                <Plus size={13} /> Tambah materi
              </button>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between mt-8">
          <p className="text-[13px] text-muted">{includedCount} materi dipilih</p>
          <Button icon={ChevronRight} onClick={continueToSetup} disabled={includedCount === 0}>
            Lanjutkan ke Pembuatan Soal
          </Button>
        </div>
      </div>
    </main>
  );
}

function ViewRow({ item, onToggle, onEdit, onDelete }: { item: Item; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const d = item.data;
  const low = item.confidence === "medium" || item.confidence === "low";
  const title = d.jp || d.pattern || d.title;
  const subtitle = item.category === "reading" ? `${d.questions?.length || 0} pertanyaan` : d.arti || d.fungsi;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <input type="checkbox" checked={item.is_included} onChange={onToggle} className="accent-sage w-4 h-4" />
      <div className={`min-w-[60px] ${item.category === "grammar" || item.category === "reading" ? "text-sm" : "text-lg"} font-voice text-ink`}>
        {title}
      </div>
      <div className="flex-1">
        <p className="text-[13.5px] text-ink">
          {item.category !== "reading" && item.category !== "grammar" && <span>{d.reading || d.romaji} — </span>}
          <span className="text-muted">{subtitle}</span>
        </p>
        {low && (
          <span className="inline-block mt-1 text-[11px] text-accentRed bg-accentRed-soft px-1.5 py-0.5 rounded-full">
            Perlu diverifikasi
          </span>
        )}
      </div>
      <button onClick={onEdit} className="text-muted hover:text-ink p-1">
        <Pencil size={15} />
      </button>
      <button onClick={onDelete} className="text-muted hover:text-ink p-1">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function EditRow({ category, draft, setDraft, onCancel, onSave }: any) {
  const set = (key: string, value: any) => setDraft((d: any) => ({ ...d, [key]: value }));
  const inputCls = "border border-line rounded-md px-2 py-1.5 text-[13px] w-full bg-bg";

  if (category === "grammar") {
    return (
      <div className="p-4 bg-beige space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input className={`${inputCls} font-voice`} value={draft.pattern} onChange={(e) => set("pattern", e.target.value)} placeholder="Pola" />
          <input className={inputCls} value={draft.fungsi} onChange={(e) => set("fungsi", e.target.value)} placeholder="Fungsi" />
        </div>
        <input className={`${inputCls} font-voice`} value={draft.kalimatSoal} onChange={(e) => set("kalimatSoal", e.target.value)} placeholder="Kalimat soal dengan ____" />
        <div className="grid grid-cols-4 gap-2">
          {(draft.opsi || ["", "", "", ""]).map((o: string, i: number) => (
            <input
              key={i}
              className={`${inputCls} font-voice`}
              value={o}
              onChange={(e) => {
                const opsi = [...draft.opsi];
                opsi[i] = e.target.value;
                set("opsi", opsi);
              }}
            />
          ))}
        </div>
        <select className={inputCls} value={draft.jawaban} onChange={(e) => set("jawaban", e.target.value)}>
          <option value="">Pilih jawaban benar</option>
          {(draft.opsi || []).map((o: string, i: number) => (
            <option key={i} value={o}>{o || `(pilihan ${i + 1} kosong)`}</option>
          ))}
        </select>
        <textarea className={inputCls} rows={2} value={draft.penjelasan} onChange={(e) => set("penjelasan", e.target.value)} placeholder="Penjelasan" />
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCancel} className="text-sm text-muted px-3 py-1.5">Batal</button>
          <Button icon={Check} onClick={onSave}>Simpan</Button>
        </div>
      </div>
    );
  }

  if (category === "reading") {
    return (
      <div className="p-4 bg-beige space-y-2">
        <input className={inputCls} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul" />
        <textarea className={`${inputCls} font-voice`} rows={4} value={draft.text} onChange={(e) => set("text", e.target.value)} placeholder="Teks bacaan" />
        <p className="text-[12px] text-muted">Pertanyaan untuk bacaan ini diedit lewat SQL/Supabase Studio untuk saat ini.</p>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCancel} className="text-sm text-muted px-3 py-1.5">Batal</button>
          <Button icon={Check} onClick={onSave}>Simpan</Button>
        </div>
      </div>
    );
  }

  // kotoba / kanji
  return (
    <div className="p-4 bg-beige flex items-center gap-2">
      <input className={`${inputCls} font-voice w-20`} value={draft.jp} onChange={(e) => set("jp", e.target.value)} />
      <input className={inputCls} value={draft.reading || draft.romaji || ""} onChange={(e) => set("reading", e.target.value)} placeholder="Bacaan" />
      <input className={inputCls} value={draft.arti} onChange={(e) => set("arti", e.target.value)} placeholder="Arti" />
      <button onClick={onSave} className="text-sage-dark p-1"><Check size={16} /></button>
      <button onClick={onCancel} className="text-muted p-1"><X size={16} /></button>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<main className="px-8 py-12 text-center text-sm text-muted">Memuat...</main>}>
      <VerifyInner />
    </Suspense>
  );
}
