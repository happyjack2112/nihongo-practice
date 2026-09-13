"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={signOut}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
    >
      <LogOut size={14} /> Keluar
    </button>
  );
}
