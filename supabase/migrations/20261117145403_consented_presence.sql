-- Create bakalim2 through Supabase Auth admin first; never seed Auth tables directly.
do $$ begin
  if (select count(*) from auth.users where email in ('bakalim@bakalim.local','bakalim2@bakalim.local') and email_confirmed_at is not null) <> 2 then
    raise exception 'Both confirmed couple accounts must exist before this migration';
  end if;
end $$;

create table public.couple_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  login_name text not null unique,
  account_role text not null unique check (account_role in ('subject','viewer')),
  letter_owner_id uuid not null references auth.users(id)
);
alter table public.couple_accounts enable row level security;
revoke all on public.couple_accounts from anon,authenticated;
grant select on public.couple_accounts to authenticated;
create policy account_self on public.couple_accounts for select to authenticated using (user_id=(select auth.uid()));
create index couple_accounts_letter_owner_idx on public.couple_accounts(letter_owner_id);

insert into public.couple_accounts(user_id,login_name,account_role,letter_owner_id)
select id,'bakalım','subject',id from auth.users where email='bakalim@bakalim.local';
insert into public.couple_accounts(user_id,login_name,account_role,letter_owner_id)
select u.id,'bakalım2','viewer',o.id from auth.users u cross join auth.users o
where u.email='bakalim2@bakalim.local' and o.email='bakalim@bakalim.local';

create table public.couple_presence (
  user_id uuid primary key references public.couple_accounts(user_id) on delete cascade,
  sharing boolean not null default false,
  last_seen_at timestamptz,
  last_login_at timestamptz,
  check(sharing or (last_seen_at is null and last_login_at is null))
);
insert into public.couple_presence(user_id) select user_id from public.couple_accounts where account_role='subject';
alter table public.couple_presence enable row level security;
revoke all on public.couple_presence from anon,authenticated;
grant select,update on public.couple_presence to authenticated;
create policy presence_read on public.couple_presence for select to authenticated using (
  user_id=(select auth.uid()) or exists(select 1 from public.couple_accounts where user_id=(select auth.uid()) and account_role='viewer')
);
create policy presence_self_update on public.couple_presence for update to authenticated
using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create function public.set_presence_sharing(enabled boolean) returns setof public.couple_presence
language sql security invoker set search_path='' as $$
  update public.couple_presence set sharing=enabled,
    last_seen_at=case when enabled then now() else null end,
    last_login_at=case when enabled then last_login_at else null end
  where user_id=(select auth.uid()) returning *;
$$;
create function public.presence_heartbeat() returns void
language sql security invoker set search_path='' as $$
  update public.couple_presence set last_seen_at=now() where user_id=(select auth.uid()) and sharing;
$$;
create function public.record_presence_login() returns void
language sql security invoker set search_path='' as $$
  update public.couple_presence set last_login_at=now() where user_id=(select auth.uid()) and sharing;
$$;
create function public.read_couple_presence() returns table(sharing boolean,last_seen_at timestamptz,last_login_at timestamptz,is_online boolean)
language sql stable security invoker set search_path='' as $$
  select p.sharing,p.last_seen_at,p.last_login_at,
    coalesce(p.sharing and p.last_seen_at > now()-interval '60 seconds',false)
  from public.couple_presence p;
$$;
revoke all on function public.set_presence_sharing(boolean),public.presence_heartbeat(),public.record_presence_login(),public.read_couple_presence() from public,anon;
grant execute on function public.set_presence_sharing(boolean),public.presence_heartbeat(),public.record_presence_login(),public.read_couple_presence() to authenticated;

drop policy couple_letters_select on public.couple_letters;
drop policy couple_letters_insert on public.couple_letters;
drop policy couple_letters_update on public.couple_letters;
create policy couple_letters_select on public.couple_letters for select to authenticated
using(user_id=(select letter_owner_id from public.couple_accounts where user_id=(select auth.uid())));
create policy couple_letters_insert on public.couple_letters for insert to authenticated
with check(user_id=(select letter_owner_id from public.couple_accounts where user_id=(select auth.uid())));
create policy couple_letters_update on public.couple_letters for update to authenticated
using(user_id=(select letter_owner_id from public.couple_accounts where user_id=(select auth.uid())))
with check(user_id=(select letter_owner_id from public.couple_accounts where user_id=(select auth.uid())));
