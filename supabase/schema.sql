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

create policy "profiles updatable by self or family" on public.profiles
for update using (user_id = auth.uid()::text or public.is_family_member(family_id)) with check (user_id = auth.uid()::text or public.is_family_member(family_id));

create policy "profiles deletable by self or family" on public.profiles
for delete using (user_id = auth.uid()::text or public.is_family_member(family_id));

create policy "tasks scoped to family" on public.tasks
for select using (public.is_family_member(family_id));

create policy "tasks writable by family members" on public.tasks
for insert with check (public.is_family_member(family_id));

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
for insert with check (public.is_family_member(family_id));

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

create or replace function public.seed_demo_family()
returns void
language plpgsql
security definer
as $$
declare
  family_id text;
begin
  if exists (select 1 from public.families limit 1) then
    return;
  end if;

  insert into public.families (id, name, invite_code, created_by)
  values ('fam-silva-01', 'Família Silva', 'SILVA-2024', 'prof-parent-01')
  returning id into family_id;

  insert into public.profiles (id, family_id, name, full_name, role, avatar_url, title, level, xp, xp_base, xp_to_next_level, balance, streak_days, created_at)
  values
    ('prof-parent-01', family_id, 'Pai Carlos', 'Pai Carlos', 'parent', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm_ZnxZqGSxN7aCmKe8gUASDo9LG_etKr1-fYNyFaBtIlmOC1SQhupXGRTscXR8PcJ6FAoT6jNUrhq6FL2FIzQusDtnQmw5v4bz0e0j_cE245ofRIBr3Ashfkw-B4S1KWKrrkc7Nk28hmcJs_FOmfF6fsfNLnjfyRMMca1fS_2g9uvz8bjMAEMhlMfT9qC4yGY2GYprXTXvxNgxE24reBkL92DFYTIrMKYCzeW7VT4c3E77glIbvz8', 'Guardião da Família', 10, 2500, 2500, 3000, 0, 14, now()),
    ('prof-child-01', family_id, 'Lucas', 'Lucas', 'child', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB18wys5nYyac2MrozkKprxhinUWPV2o40LYPF802fh24haBQFfluT5h2gX4atGnOlB5PKaWGscXO2j-cR45ZdzmPpwmxHWz5wOOFo9MiBw8rEH-W2Jzg-q9zwOQXc82a_oCHcph0vDplDlNuDhySZClgbE4dN77YXfQqZZ9CqZgoHMys0TA4-n1cImem-xex753SA3pNd2vld3oHwandJHM0ev1sTByTYiR2wt-vva3nDbpPaBthzZ', 'Aventureiro', 5, 450, 0, 500, 45.0, 7, now()),
    ('prof-child-02', family_id, 'Maria', 'Maria', 'child', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5Qf8vZ62PdChHjXeYrif-mnbXhSWxW5dGLhkC1b3LzPP0sNZKyQSCnThtt_oImh6F5XRCoItueiIk1tAiIIRg7Ae78gejyehP8uFQ8SjntYfhxl5NZPc8vI6fKiZcC0SRX3ZKoRc8jmn1svJigbFFDUYIeuKLtANyRVvNbJWXQXhpCCqyh_wWrtGqdThVhJZCKbgVhSsbXgZ0PmcwPomubOZhRsbX-yUQBguBuRmwy59AmObyEmzE', 'Exploradora', 4, 320, 0, 400, 30.0, 5, now());

  insert into public.tasks (id, family_id, title, description, category, icon_name, assigned_to, created_by, points, reward_value, reward_type, reward_money, status, submitted_at, created_at)
  values
    ('task-01', family_id, 'Limpar o Quarto', 'Arrumar brinquedos, organizar a escrivaninha e passar pano no chão.', 'cleaning', 'cleaning_services', 'prof-child-01', 'prof-parent-01', 50, 50, 'xp_only', 0, 'waiting_approval', 'Há 2 horas', now()),
    ('task-02', family_id, 'Passear com o Cachorro', 'Volta de 20 minutos pela praça com coleira e saquinhos.', 'pet', 'pets', 'prof-child-02', 'prof-parent-01', 30, 30, 'xp_only', 0, 'waiting_approval', 'Há 4 horas', now()),
    ('task-03', family_id, 'Lavar a Louça', 'Lavar, secar e guardar os pratos do almoço.', 'kitchen', 'local_dining', 'prof-child-01', 'prof-parent-01', 40, 40, 'xp_only', 0, 'waiting_approval', 'Há 5 horas', now());

  insert into public.rewards (id, family_id, title, description, points_cost, money_cost, category, image_url, is_available, created_at)
  values
    ('rew-01', family_id, 'Sorvete no Final de Semana', 'Escolha seu sabor favorito na sorveteria do bairro.', 300, 0, 'food', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaZIHFQS37oiPujwTQMUSHspf_yIsrpKYyPFlWMR__9xJtI4mmH85_WNDpvDU51LQ0DZ-idh0RQzmMwPisBspDe0pjXHR1nMPneDLGIuNSLAkIdymtlWunp3cpNGZ1bEz-sinX-OZkqS5PpxFIjq1KBb0NssIk-HcjH7nekUsh4ico8nbzkObyXxHMPuNRLv6JEApSeVPr_46g1F5uHYyIVgqDzbbeQy_vy9vW3cAYFZQJBfn1A805', true, now()),
    ('rew-02', family_id, '30 min de Game', 'Tempo extra para jogar videogame hoje.', 500, 0, 'entertainment', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMCl48S4QAHGs8QdBNO2GFxi0ZeVz-MQotIKjNC5tHtoORmFWpNu_aObN5MpXr2UAa7q5iTZiWbmecAqPEx6Gkegc032pjfJ7iARSrywQtj_QQacUFq3IFgPJPrZtMiFtI9s_lmx8-G2azo0ymz7iImqYu6jp8koE63b1LqFd8nhPCtWyQl3suwFfHEuttEFr1eX6vvtfdnCt03QYF6uUb9QmTW2rpvIXdfpdO1EcuUYsUegqEg1h7', true, now());
end;
$$;

select public.seed_demo_family();
