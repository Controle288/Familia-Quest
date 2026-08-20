-- ============================================================
-- FamiliaQuest — ajuste de schema para PAGAMENTOS (projeto existente)
-- Idempotente: pode rodar quantas vezes quiser. Cole no
-- Supabase Dashboard -> SQL Editor -> Run.
-- ============================================================

-- Super-admin (dono do app). Preciso para o painel admin funcionar.
create table if not exists public.admins (
  user_id text primary key,
  created_at timestamptz not null default now()
);

-- Configuracoes da familia (plano/tema). Se ja existir, nao recria.
create table if not exists public.family_settings (
  family_id text primary key,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  theme text not null default 'default',
  theme_variant text not null default 'light' check (theme_variant in ('light', 'dark')),
  background_key text,
  schedule_enabled boolean not null default false,
  location_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Planos (gerenciados pelo admin). O checkout le desta tabela.
create table if not exists public.plans (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric not null default 0,
  interval text not null default 'month' check (interval in ('month', 'year', 'once')),
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Configuracao de pagamento (admin-only). Chaves usadas pelas Edge Functions.
create table if not exists public.payment_settings (
  provider text primary key check (provider in ('stripe', 'mercadopago')),
  public_key text,
  secret_key text,
  webhook_secret text,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- Colunas de rastreamento de assinatura/renovação.
alter table public.family_settings add column if not exists plan_provider text;
alter table public.family_settings add column if not exists plan_interval text;
alter table public.family_settings add column if not exists subscription_id text;
alter table public.family_settings add column if not exists plan_expires_at timestamptz;

-- Helper: e admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid()::text);
$$;

-- RLS
alter table public.admins enable row level security;
alter table public.family_settings enable row level security;
alter table public.plans enable row level security;
alter table public.payment_settings enable row level security;

drop policy if exists "admins select" on public.admins;
create policy "admins select" on public.admins for select using (public.is_admin());

drop policy if exists "family_settings select" on public.family_settings;
create policy "family_settings select" on public.family_settings
  for select using (public.is_family_member(family_id));
drop policy if exists "family_settings update" on public.family_settings;
create policy "family_settings update" on public.family_settings
  for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
drop policy if exists "family_settings insert" on public.family_settings;
create policy "family_settings insert" on public.family_settings
  for insert with check (public.is_family_member(family_id));

drop policy if exists "plans select" on public.plans;
create policy "plans select" on public.plans for select using (auth.uid() is not null);
drop policy if exists "plans write" on public.plans;
create policy "plans write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payment_settings admin" on public.payment_settings;
create policy "payment_settings admin" on public.payment_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Para virar admin (cole seu user_id do Supabase Auth):
--   insert into public.admins (user_id) values ('SEU_USER_ID');
-- ============================================================
