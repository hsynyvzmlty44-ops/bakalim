-- Both devices sign in to the existing shared couple account.
create table public.couple_letters (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  greeting text not null default 'Sevgilim,' check (char_length(greeting) <= 60),
  content text not null default '' check (char_length(content) <= 10000),
  updated_at timestamptz not null default now()
);
alter table public.couple_letters enable row level security;
revoke all on public.couple_letters from anon, authenticated;
grant select, insert, update on public.couple_letters to authenticated;
create policy couple_letters_select on public.couple_letters for select to authenticated
  using ((select auth.uid()) = user_id);
create policy couple_letters_insert on public.couple_letters for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy couple_letters_update on public.couple_letters for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
