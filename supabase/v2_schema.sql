-- ============================================================================
-- FamilyQuest v2 — extensões de schema (admin, planos, pagamentos, temas,
-- horários, localização, tickets, exclusão em cascata).
-- Execute após o schema.sql base. Idempotente (if not exists / if not column).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Super-admin (o dono do app). Separado de families/profile.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  user_id text primary key,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Configurações da família: plano, tema, toggles de recursos opcionais.
-- ---------------------------------------------------------------------------
create table if not exists public.family_settings (
  family_id text primary key references public.families(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  theme text not null default 'default',
  theme_variant text not null default 'light' check (theme_variant in ('light', 'dark')),
  background_key text,
  schedule_enabled boolean not null default false,
  location_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Planos (gerenciados pelo admin).
-- limits jsonb ex.: {"maxChildren": 2, "themes": false, "schedule": false, "location": false}
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  price numeric not null default 0,
  interval text not null default 'month' check (interval in ('month', 'year', 'once')),
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Configuração de pagamento (admin-only). Chaves usadas server-side pelas
-- Edge Functions (nunca expostas ao cliente).
-- ---------------------------------------------------------------------------
create table if not exists public.payment_settings (
  provider text primary key check (provider in ('stripe', 'mercadopago')),
  public_key text,
  secret_key text,
  webhook_secret text,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tickets de suporte (pais -> admin).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Localização opcional dos filhos (opt-in, consentimento dos pais).
-- ---------------------------------------------------------------------------
create table if not exists public.profile_locations (
  profile_id text primary key references public.profiles(id) on delete cascade,
  family_id text not null references public.families(id) on delete cascade,
  lat numeric,
  lng numeric,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Horários nas tarefas.
-- ---------------------------------------------------------------------------
alter table public.tasks add column if not exists due_time timestamptz;
alter table public.tasks add column if not exists recurrence text check (recurrence in ('none', 'daily', 'weekly')) default 'none';
alter table public.tasks add column if not exists reminder_minutes integer default 0;

-- Preferência de tema por perfil (opcional).
alter table public.profiles add column if not exists theme_pref text;

-- Relação familiar específica do perfil (mae, pai, avo, outro, filho).
alter table public.profiles add column if not exists relationship text
  check (relationship in ('mae', 'pai', 'avo', 'outro', 'filho'));

-- Rastreamento de assinatura/renovação (Stripe / Mercado Pago).
alter table public.family_settings add column if not exists plan_provider text;
alter table public.family_settings add column if not exists plan_interval text;
alter table public.family_settings add column if not exists subscription_id text;
alter table public.family_settings add column if not exists plan_expires_at timestamptz;

-- ---------------------------------------------------------------------------
-- Índices.
-- ---------------------------------------------------------------------------
create index if not exists idx_support_tickets_family_id on public.support_tickets(family_id);
create index if not exists idx_profile_locations_family_id on public.profile_locations(family_id);

-- ---------------------------------------------------------------------------
-- RLS.
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.family_settings enable row level security;
alter table public.plans enable row level security;
alter table public.payment_settings enable row level security;
alter table public.support_tickets enable row level security;
alter table public.profile_locations enable row level security;

-- Helper: é admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid()::text);
$$;

-- Helper: contagem de membros de uma família (pais + filhos).
create or replace function public.family_member_count(check_family_id text)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.profiles p where p.family_id = check_family_id;
$$;

-- admins: só admins leem.
drop policy if exists "admins select" on public.admins;
create policy "admins select" on public.admins for select using (public.is_admin());

-- family_settings: membros da família leem/atualizam a própria.
drop policy if exists "family_settings select" on public.family_settings;
create policy "family_settings select" on public.family_settings
  for select using (public.is_family_member(family_id));
drop policy if exists "family_settings update" on public.family_settings;
create policy "family_settings update" on public.family_settings
  for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
drop policy if exists "family_settings insert" on public.family_settings;
create policy "family_settings insert" on public.family_settings
  for insert with check (public.is_family_member(family_id));

-- plans: todos autenticados leem; só admin escreve.
drop policy if exists "plans select" on public.plans;
create policy "plans select" on public.plans for select using (auth.uid() is not null);
drop policy if exists "plans write" on public.plans;
create policy "plans write" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- payment_settings: só admin (incluindo leitura do próprio registro).
drop policy if exists "payment_settings admin" on public.payment_settings;
create policy "payment_settings admin" on public.payment_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- support_tickets: família vê/cria os seus; admin vê/atualiza todos.
drop policy if exists "tickets family" on public.support_tickets;
create policy "tickets family" on public.support_tickets
  for select using (public.is_family_member(family_id));
drop policy if exists "tickets insert" on public.support_tickets;
create policy "tickets insert" on public.support_tickets
  for insert with check (public.is_family_member(family_id));
drop policy if exists "tickets admin" on public.support_tickets;
create policy "tickets admin" on public.support_tickets
  for all using (public.is_admin()) with check (public.is_admin());

-- profile_locations: membros leem; o próprio filho (ou parente) escreve o seu.
drop policy if exists "locations select" on public.profile_locations;
create policy "locations select" on public.profile_locations
  for select using (public.is_family_member(family_id));
drop policy if exists "locations write" on public.profile_locations;
create policy "locations write" on public.profile_locations
  for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

-- Plano grátis padrão: gatilho cria family_settings ao criar família.
create or replace function public.ensure_family_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_settings (family_id, plan)
  values (new.id, 'free')
  on conflict (family_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_family_settings on public.families;
create trigger trg_ensure_family_settings
  after insert on public.families
  for each row execute function public.ensure_family_settings();

-- ---------------------------------------------------------------------------
-- Storage: bucket "avatars" (fotos de perfil). Crie o bucket no painel do
-- Supabase (público) e as policies abaixo liberam leitura pública + escrita
-- autenticada.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars write" on storage.objects;
create policy "avatars write" on storage.objects
  for all using (bucket_id = 'avatars' and auth.uid() is not null)
  with check (bucket_id = 'avatars' and auth.uid() is not null);
