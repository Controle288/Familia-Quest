-- ============================================================
-- FamiliaQuest — cria a tabela de SUPORTE (tickets de pais -> admin)
-- Idempotente. Cole no Supabase Dashboard -> SQL Editor -> Run.
-- Depende dos helpers is_family_member() e is_admin() (ja criados
-- pelos scripts anteriores de setup).
-- ============================================================

create table if not exists public.support_tickets (
  id text primary key default gen_random_uuid()::text,
  family_id text not null references public.families(id) on delete cascade,
  author_profile_id text not null references public.profiles(id) on delete cascade,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done', 'answered')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_family_id on public.support_tickets(family_id);

alter table public.support_tickets enable row level security;

drop policy if exists "tickets family" on public.support_tickets;
create policy "tickets family" on public.support_tickets
  for select using (public.is_family_member(family_id));

drop policy if exists "tickets insert" on public.support_tickets;
create policy "tickets insert" on public.support_tickets
  for insert with check (public.is_family_member(family_id));

drop policy if exists "tickets admin" on public.support_tickets;
create policy "tickets admin" on public.support_tickets
  for all using (public.is_admin()) with check (public.is_admin());
