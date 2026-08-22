-- Famílias gerenciadas por um administrador do app herdam o premium para
-- todos os membros (pais e filhos). A flag é persistida na família para que
-- perfis não-admin (ex.: filhos que entraram por código) também recebam acesso.
alter table public.family_settings
  add column if not exists admin_managed boolean not null default false;
