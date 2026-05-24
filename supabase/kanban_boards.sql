create table if not exists public.kanban_boards (
    user_id uuid primary key references auth.users (id) on delete cascade,
    board_state jsonb not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.kanban_boards enable row level security;

drop policy if exists "kanban_boards_select_own" on public.kanban_boards;
create policy "kanban_boards_select_own"
on public.kanban_boards
for select
using (auth.uid() = user_id);

drop policy if exists "kanban_boards_insert_own" on public.kanban_boards;
create policy "kanban_boards_insert_own"
on public.kanban_boards
for insert
with check (auth.uid() = user_id);

drop policy if exists "kanban_boards_update_own" on public.kanban_boards;
create policy "kanban_boards_update_own"
on public.kanban_boards
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
