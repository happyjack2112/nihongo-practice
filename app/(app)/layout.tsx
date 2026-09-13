import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TopNav from "@/components/TopNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { count } = await supabase
    .from("review_queue")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("resolved", false);

  return (
    <div className="min-h-screen bg-bg">
      <TopNav reviewCount={count || 0} />
      {children}
    </div>
  );
}
