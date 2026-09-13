import { createBrowserClient } from "@supabase/ssr";

// Dipakai di client component — otomatis membawa sesi login pengguna
// lewat cookie, sehingga RLS di database berjalan sebagai pengguna tersebut.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
