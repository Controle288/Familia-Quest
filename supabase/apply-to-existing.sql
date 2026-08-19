-- ============================================================
-- FamiliaQuest — migration for an EXISTING Supabase project
-- (tables already exist; adds columns, helpers and role-aware RLS)
-- Run this in: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1) Novas colunas (idempotente: não erra se já existirem)
alter table public.profiles
  add column if not exists xp_base integer not null default 0;

alter table public.rewards
  add column if not exists money_cost numeric not null default 0;

-- 2) Funções helper (idempotente)
create or replace function public.is_family_member(check_family_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.family_id = check_family_id
      and p.user_id = auth.uid()::text
  );
$$;

create or replace function public.is_parent(check_family_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.family_id = check_family_id
      and p.user_id = auth.uid()::text
      and p.role = 'parent'
  );
$$;

create or replace function public.my_profile_id(check_family_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select p.id from public.profiles p
  where p.family_id = check_family_id
    and p.user_id = auth.uid()::text
  limit 1;
$$;

-- 3) Relaxar/endurecer RLS de profiles (hierarquia pai/filho)
drop policy if exists "profiles updatable by self or family" on public.profiles;
drop policy if exists "profiles updatable by self or parent" on public.profiles;
create policy "profiles updatable by self or parent" on public.profiles
  for update
  using (user_id = auth.uid()::text or public.is_parent(family_id))
  with check (user_id = auth.uid()::text or public.is_parent(family_id));

drop policy if exists "profiles deletable by self or family" on public.profiles;
drop policy if exists "profiles deletable by parent" on public.profiles;
create policy "profiles deletable by parent" on public.profiles
  for delete
  using (public.is_parent(family_id));

-- 4) Filho só cria tarefa para si; pai cria para qualquer um da família
drop policy if exists "tasks writable by family members" on public.tasks;
create policy "tasks writable by family members" on public.tasks
  for insert with check (public.is_family_member(family_id) and (public.is_parent(family_id) or assigned_to = public.my_profile_id(family_id)));

-- 5) Filho só resgata para si; pai pode resgatar por qualquer um
drop policy if exists "redemptions writable by family members" on public.redemptions;
create policy "redemptions writable by family members" on public.redemptions
  for insert with check (public.is_family_member(family_id) and (public.is_parent(family_id) or profile_id = public.my_profile_id(family_id)));

-- ============================================================
-- Verificação (opcional):
-- select column_name from information_schema.columns
--   where table_name = 'profiles' and column_name = 'xp_base';
-- select column_name from information_schema.columns
--   where table_name = 'rewards' and column_name = 'money_cost';
-- ============================================================
