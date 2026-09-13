import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dipakai di server component / route handler biasa — tetap sebagai
// pengguna yang login, jadi RLS tetap berlaku (aman untuk operasi
// yang memang milik pengguna itu sendiri).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

// Dipakai HANYA di route handler untuk operasi backend murni (mis. worker
// ekstraksi PDF) yang perlu melewati RLS, mis. menulis hasil AI ke baris
// milik pengguna lain dari proses async. Service role key TIDAK PERNAH
// boleh dikirim ke browser — hanya dipakai di server.
export function createServiceClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
