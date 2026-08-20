create extension if not exists "pgcrypto";

create table if not exists public.families (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  invite_code text not null unique,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id text primary key,
  family_id text not null references public.families(id) on delete cascade,
  user_id text,
  name text not null,
  full_name text not null,
  role text not null check (role in ('parent', 'child')),
  avatar_url text,
  title text,
  level integer not null default 1,
  xp integer not null default 0,
  xp_base integer not null default 0,
  xp_to_next_level integer not null default 500,
  balance numeric not null default 0,
  streak_days integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  family_id text not null references public.families(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  icon_name text,
  assigned_to text not null,
  created_by text,
  points integer not null default 0,
  reward_value integer not null default 0,
  reward_type text not null default 'xp_only',
  reward_money numeric default 0,
  status text not null default 'pending' check (status in ('pending', 'waiting_approval', 'completed')),
  due_date timestamptz,
  submitted_at text,
  approved_at text,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id text primary key,
  family_id text not null references public.families(id) on delete cascade,
  title text not null,
  description text not null,
  points_cost integer not null default 0,
  money_cost numeric not null default 0,
  category text not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.redemptions (
  id text primary key,
  family_id text not null references public.families(id) on delete cascade,
  reward_id text not null,
  reward_title text not null,
  profile_id text not null,
  profile_name text not null,
  points_spent integer not null default 0,
  status text not null default 'requested' check (status in ('requested', 'approved', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id text primary key,
  family_id text not null references public.families(id) on delete cascade,
  profile_id text not null,
  profile_name text not null,
  type text not null,
  title text not null,
  points_change integer not null default 0,
  money_change numeric default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_families_invite_code on public.families(invite_code);
create index if not exists idx_profiles_family_id on public.profiles(family_id);
create index if not exists idx_tasks_family_id on public.tasks(family_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_rewards_family_id on public.rewards(family_id);
create index if not exists idx_redemptions_family_id on public.redemptions(family_id);
create index if not exists idx_activity_logs_family_id on public.activity_logs(family_id);

alter table public.families enable row level security;
-- Relação familiar específica do perfil (mae, pai, avo, outro, filho).
alter table public.profiles add column if not exists relationship text
  check (relationship in ('mae', 'pai', 'avo', 'outro', 'filho'));

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;
alter table public.activity_logs enable row level security;

-- Helper: is the authenticated user a member of the given family?
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

-- Is the authenticated user a PARENT in the given family?
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

-- The id of the authenticated user's own profile in the given family (or null).
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

create policy "families readable by authenticated" on public.families
for select using (auth.uid() is not null);

create policy "families insertable by authenticated" on public.families
for insert with check (auth.uid() is not null and created_by = auth.uid()::text);

create policy "families manageable by members" on public.families
for update using (public.is_family_member(id)) with check (public.is_family_member(id));

create policy "families deletable by members" on public.families
for delete using (public.is_family_member(id));

create policy "profiles readable by self or family" on public.profiles
for select using (user_id = auth.uid()::text or public.is_family_member(family_id));

create policy "profiles insertable by self" on public.profiles
for insert with check (user_id = auth.uid()::text);

create policy "profiles updatable by self or parent" on public.profiles
for update using (user_id = auth.uid()::text or public.is_parent(family_id)) with check (user_id = auth.uid()::text or public.is_parent(family_id));

create policy "profiles deletable by parent" on public.profiles
for delete using (public.is_parent(family_id));

create policy "tasks scoped to family" on public.tasks
for select using (public.is_family_member(family_id));

create policy "tasks writable by family members" on public.tasks
for insert with check (public.is_family_member(family_id) and (public.is_parent(family_id) or assigned_to = public.my_profile_id(family_id)));

create policy "tasks updateable by family members" on public.tasks
for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "tasks deletable by family members" on public.tasks
for delete using (public.is_family_member(family_id));

create policy "rewards scoped to family" on public.rewards
for select using (public.is_family_member(family_id));

create policy "rewards writable by family members" on public.rewards
for insert with check (public.is_family_member(family_id));

create policy "rewards updateable by family members" on public.rewards
for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "rewards deletable by family members" on public.rewards
for delete using (public.is_family_member(family_id));

create policy "redemptions scoped to family" on public.redemptions
for select using (public.is_family_member(family_id));

create policy "redemptions writable by family members" on public.redemptions
for insert with check (public.is_family_member(family_id) and (public.is_parent(family_id) or profile_id = public.my_profile_id(family_id)));

create policy "redemptions updateable by family members" on public.redemptions
for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "redemptions deletable by family members" on public.redemptions
for delete using (public.is_family_member(family_id));

create policy "activity_logs scoped to family" on public.activity_logs
for select using (public.is_family_member(family_id));

create policy "activity_logs writable by family members" on public.activity_logs
for insert with check (public.is_family_member(family_id));

create policy "activity_logs updateable by family members" on public.activity_logs
for update using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));

create policy "activity_logs deletable by family members" on public.activity_logs
for delete using (public.is_family_member(family_id));

