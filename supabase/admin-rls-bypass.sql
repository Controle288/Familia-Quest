-- Bypass de RLS para administradores do app no painel "Famílias".
-- IMPORTANTE: este script NÃO habilita o RLS nem remove políticas existentes.
-- Ele apenas ADICIONA acesso total para usuários presentes na tabela `admins`
-- (as policies são do tipo OR, então não quebram o acesso dos usuários comuns).
--
-- Só rode se a lista de famílias do admin vier vazia ou se o botão
-- "Tornar Premium" não salvar (sintoma de RLS bloqueando leitura/escrita
-- cross-family). Se o "Visão geral" já mostra as contagens globais corretas,
-- o RLS já libera e este script é desnecessário.

-- Função auxiliar: true se o usuário logado é admin.
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Policies de bypass para admin (leitura/escrita total nas tabelas usadas
-- pela seção Famílias do painel admin).
drop policy if exists "admin_full_families" on public.families;
create policy "admin_full_families" on public.families
  for all using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "admin_full_profiles" on public.profiles;
create policy "admin_full_profiles" on public.profiles
  for all using (public.is_app_admin()) with check (public.is_app_admin());

drop policy if exists "admin_full_settings" on public.family_settings;
create policy "admin_full_settings" on public.family_settings
  for all using (public.is_app_admin()) with check (public.is_app_admin());
