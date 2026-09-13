"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setNotice("Akun dibuat. Cek email kamu untuk konfirmasi sebelum login.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sage text-white font-voice text-lg mb-3">
            学
          </div>
          <h1 className="font-voice text-2xl text-ink">Nihongo Practice</h1>
          <p className="text-muted text-sm mt-1">
            {mode === "signin" ? "Masuk untuk melanjutkan belajar" : "Buat akun baru"}
          </p>
        </div>

        <form onSubmit={submit} className="bg-white border border-line rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-sage"
              placeholder="kamu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Kata sandi</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-sage"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && <p className="text-xs text-accentRed">{error}</p>}
          {notice && <p className="text-xs text-sage-dark">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Memproses..." : mode === "signin" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setNotice("");
            }}
            className="text-sage-dark font-medium underline"
          >
            {mode === "signin" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </main>
  );
}
