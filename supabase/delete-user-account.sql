-- ============================================================================
-- RPC: delete_user_account
-- Apaga a conta do usuário autenticado (e todos os seus dados) de forma segura
-- no próprio Postgres, eliminando a dependência de Edge Function.
--
-- Execute este script no SQL Editor do Supabase (uma única vez).
-- A função roda com SECURITY DEFINER (privilégios de admin) e só apaga os
-- dados do próprio usuário (filtrado por auth.uid()).
-- ============================================================================

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_ids text[];
  v_family_ids text[];
  fid text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  -- Coleta os perfis e famílias do usuário.
  select array_agg(p.id), array_agg(p.family_id)
    into v_profile_ids, v_family_ids
  from public.profiles p
  where p.user_id = v_user_id::text;

  -- Remove os perfis (cascata em support_tickets, profile_locations).
  delete from public.profiles p
  where p.user_id = v_user_id::text;

  -- Para cada família que ficar vazia, apaga a família — o que em cascata
  -- remove tasks, rewards, redemptions, activity_logs, family_settings etc.
  if v_family_ids is not null then
    foreach fid in array v_family_ids loop
      if not exists (select 1 from public.profiles p where p.family_id = fid) then
        delete from public.families f where f.id = fid;
      end if;
    end loop;
  end if;

  -- Limpeza de registros órfãos em famílias que permanecem (essas tabelas
  -- referenciam profile_id mas NÃO têm FK em cascata para profiles).
  if v_profile_ids is not null then
    delete from public.redemptions r where r.profile_id = any(v_profile_ids);
    delete from public.activity_logs a where a.profile_id = any(v_profile_ids);
  end if;

  -- Hard delete do usuário em auth.users (libera o e-mail para reuso).
  delete from auth.users u where u.id = v_user_id;
end;
$$;

-- Só usuários autenticados podem executar (a função só apaga a própria conta).
revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;
