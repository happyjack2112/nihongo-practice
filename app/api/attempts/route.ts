import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/attempts — body: { extractedItemId, category, questionSnapshot, userAnswer, isCorrect }
// Trigger di database (lihat supabase/schema.sql) otomatis menambahkan
// item ke review_queue kalau isCorrect = false.
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { extractedItemId, category, questionSnapshot, userAnswer, isCorrect } = await req.json();

  const { data, error } = await supabase
    .from("attempts")
    .insert({
      user_id: user.id,
      extracted_item_id: extractedItemId,
      category,
      question_snapshot: questionSnapshot,
      user_answer: userAnswer,
      is_correct: isCorrect,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attempt: data });
}
