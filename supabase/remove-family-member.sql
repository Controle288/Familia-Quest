-- ============================================================================
-- RPC: remove_family_member
-- Permite que um RESPONSÁVEL remova um membro da própria família.
-- Validações:
--   * quem chama precisa ser responsável (parent) na mesma família do alvo;
--   * não é possível remover o último responsável (evita família órfã);
--   * remove o perfil (cascata) e, se a família ficar vazia, apaga a família;
--   * faz HARD DELETE do auth.users do membro, liberando o e-mail para reuso.
-- Execute uma única vez no SQL Editor do Supabase.
-- ============================================================================

create or replace function public.remove_family_member(target_profile_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_family_id text;
  v_target_user_id text;
  v_target_role text;
  v_remaining_parents int;
begin
  if v_caller is null then
    raise exception 'not authenticated';
  end if;

  -- Família do alvo.
  select p.family_id into v_family_id
  from public.profiles p
  where p.id = target_profile_id;

  if v_family_id is null then
    raise exception 'membro nao encontrado';
  end if;

  -- Quem chama deve ser responsável nessa família.
  if not exists (
    select 1 from public.profiles p
    where p.family_id = v_family_id
      and p.user_id = v_caller::text
      and p.role = 'parent'
  ) then
    raise exception 'apenas responsaveis podem remover membros';
  end if;

  -- Dados do alvo.
  select p.user_id, p.role into v_target_user_id, v_target_role
  from public.profiles p
  where p.id = target_profile_id;

  -- Não remover o último responsável (deixaria a família sem gestão).
  if v_target_role = 'parent' then
    select count(*) into v_remaining_parents
    from public.profiles p
    where p.family_id = v_family_id
      and p.role = 'parent'
      and p.id <> target_profile_id;
    if v_remaining_parents = 0 then
      raise exception 'nao e possivel remover o ultimo responsavel da familia';
    end if;
  end if;

  -- Limpa registros órfãos que referenciam o perfil (sem FK em cascata).
  delete from public.redemptions r where r.profile_id = target_profile_id;
  delete from public.activity_logs a where a.profile_id = target_profile_id;

  -- Remove o perfil (cascata em support_tickets, profile_locations).
  delete from public.profiles p where p.id = target_profile_id;

  -- Se a família ficou vazia, apaga (cascata em tasks/rewards/settings etc).
  if not exists (select 1 from public.profiles p where p.family_id = v_family_id) then
    delete from public.families f where f.id = v_family_id;
  end if;

  -- Hard delete do usuário em auth.users (libera o e-mail para reuso).
  if v_target_user_id is not null then
    delete from auth.users u where u.id = v_target_user_id::uuid;
  end if;
end;
$$;

revoke all on function public.remove_family_member(text) from public;
grant execute on function public.remove_family_member(text) to authenticated;
