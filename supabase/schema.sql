-- ============================================================
-- Nihongo Practice — Skema Database Supabase (tahap B)
-- Jalankan di Supabase SQL editor, atau via `supabase db push`
-- ============================================================

-- Supabase sudah menyediakan tabel auth.users bawaan.
-- Tabel profiles ini memperluasnya dengan data spesifik aplikasi.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  streak_count int not null default 0,
  last_practice_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- File PDF yang diupload pengguna
-- ------------------------------------------------------------
create table if not exists materials_upload (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null,          -- path di Supabase Storage
  status text not null default 'pending'
    check (status in ('pending', 'extracting', 'categorizing', 'done', 'error')),
  ocr_used boolean not null default false,
  raw_text text,                        -- hasil ekstraksi mentah sebelum dikategorikan
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Materi hasil ekstraksi (kotoba, kanji, grammar, reading)
-- Pakai kolom `data` (jsonb) agar bentuknya fleksibel per kategori,
-- konsisten dengan struktur objek yang sudah dipakai di prototipe React.
-- ------------------------------------------------------------
create table if not exists extracted_items (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references materials_upload(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('kotoba', 'kanji', 'grammar', 'reading')),
  -- Bentuk `data` per kategori:
  --   kotoba:  { jp, reading, romaji, arti, contoh, contohArti }
  --   kanji:   { jp, reading, arti, relatedWord, contoh, contohArti }
  --   grammar: { pattern, fungsi, contoh, kalimatSoal, opsi: string[4], jawaban, penjelasan }
  --   reading: { title, text, questions: [{ id, type, prompt, options, answer, penjelasan }] }
  data jsonb not null,
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  is_verified boolean not null default false,
  is_included boolean not null default true, -- dipilih pengguna untuk dijadikan soal
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_extracted_items_user on extracted_items(user_id);
create index if not exists idx_extracted_items_category on extracted_items(user_id, category);

-- ------------------------------------------------------------
-- Riwayat jawaban pengguna
-- question_snapshot menyimpan bentuk soal PERSIS seperti yang ditampilkan
-- saat itu, supaya riwayat tidak berubah walau extracted_items diedit lagi.
-- ------------------------------------------------------------
create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  extracted_item_id uuid references extracted_items(id) on delete set null,
  category text not null,
  question_snapshot jsonb not null,
  user_answer text,
  is_correct boolean not null,
  answered_at timestamptz not null default now()
);

create index if not exists idx_attempts_user on attempts(user_id, answered_at desc);
create index if not exists idx_attempts_item on attempts(extracted_item_id);

-- ------------------------------------------------------------
-- Antrian "Perlu Diulang"
-- Terisi otomatis dari jawaban salah (attempts) atau tanda
-- "Masih Sulit" di Mode Belajar.
-- ------------------------------------------------------------
create table if not exists review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  extracted_item_id uuid not null references extracted_items(id) on delete cascade,
  category text not null,
  reason text not null check (reason in ('wrong_answer', 'marked_difficult')),
  times_wrong int not null default 1,
  resolved boolean not null default false,
  added_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (user_id, extracted_item_id)
);

create index if not exists idx_review_queue_active on review_queue(user_id) where resolved = false;

-- ============================================================
-- Row Level Security — tiap pengguna hanya boleh akses datanya sendiri
-- ============================================================

alter table profiles enable row level security;
alter table materials_upload enable row level security;
alter table extracted_items enable row level security;
alter table attempts enable row level security;
alter table review_queue enable row level security;

create policy "profiles: user reads/updates dirinya sendiri"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "materials_upload: milik sendiri"
  on materials_upload for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "extracted_items: milik sendiri"
  on extracted_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "attempts: milik sendiri"
  on attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "review_queue: milik sendiri"
  on review_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger kecil: upsert ke review_queue saat ada jawaban salah
-- ============================================================
create or replace function fn_add_to_review_on_wrong_answer()
returns trigger as $$
begin
  if new.is_correct = false and new.extracted_item_id is not null then
    insert into review_queue (user_id, extracted_item_id, category, reason, times_wrong)
    values (new.user_id, new.extracted_item_id, new.category, 'wrong_answer', 1)
    on conflict (user_id, extracted_item_id)
    do update set
      times_wrong = review_queue.times_wrong + 1,
      resolved = false,
      resolved_at = null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_attempts_review_queue on attempts;
create trigger trg_attempts_review_queue
  after insert on attempts
  for each row execute function fn_add_to_review_on_wrong_answer();

-- ============================================================
-- Trigger: update streak_count & last_practice_at tiap ada jawaban baru
--
-- Aturan:
--   - Belum pernah latihan sama sekali        -> streak = 1
--   - Sudah latihan hari ini (tanggal sama)    -> tidak berubah
--   - Terakhir latihan kemarin (hari berturut) -> streak + 1
--   - Terakhir latihan lebih dari 1 hari lalu  -> reset streak = 1
--
-- CATATAN: pembanding tanggal di sini pakai UTC (bawaan Postgres
-- `timestamptz`), bukan zona waktu lokal pengguna. Untuk pengguna yang
-- latihan larut malam dekat pergantian hari, ini bisa terasa "meleset
-- satu hari" dibanding jam lokal mereka. Kalau ini penting, perbaikannya
-- adalah menyimpan preferensi zona waktu per pengguna di `profiles` dan
-- memakainya di sini alih-alih UTC polos.
-- ============================================================
create or replace function fn_update_streak_on_attempt()
returns trigger as $$
declare
  last_date date;
  today date := (new.answered_at at time zone 'utc')::date;
begin
  select last_practice_at::date into last_date from profiles where id = new.user_id;

  if last_date is null then
    update profiles set streak_count = 1, last_practice_at = new.answered_at where id = new.user_id;
  elsif last_date = today then
    null; -- sudah tercatat hari ini
  elsif last_date = today - 1 then
    update profiles set streak_count = streak_count + 1, last_practice_at = new.answered_at where id = new.user_id;
  else
    update profiles set streak_count = 1, last_practice_at = new.answered_at where id = new.user_id;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_attempts_streak on attempts;
create trigger trg_attempts_streak
  after insert on attempts
  for each row execute function fn_update_streak_on_attempt();

-- ============================================================
-- Trigger: buat baris profiles otomatis saat ada pengguna baru daftar
-- (dipanggil oleh Supabase Auth saat signUp berhasil)
-- ============================================================
create or replace function fn_handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function fn_handle_new_user();
