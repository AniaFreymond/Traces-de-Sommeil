create table if not exists public.sleep_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  bedtime text,
  waketime text,
  duration_minutes int,
  quality int check (quality between 1 and 5),
  notes text,
  created_at timestamptz default now()
);

alter table public.sleep_entries enable row level security;

create policy "Users can view own entries" on public.sleep_entries for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on public.sleep_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on public.sleep_entries for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on public.sleep_entries for delete using (auth.uid() = user_id);
