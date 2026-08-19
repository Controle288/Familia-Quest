-- ============================================================================
-- Ativar painel de Admin no FamilyQuest
-- ============================================================================
-- Não é preciso copiar o UUID manualmente: o SQL busca o user_id pela coluna
-- email da tabela auth.users (visível apenas no SQL Editor, como dono/RLS bypass).
-- email: wadigital792@gmail.com
-- Rode no Supabase -> SQL Editor. Depois recarregue o app: aparece o botão Admin.
-- ============================================================================

insert into public.admins (user_id)
select id from auth.users where email = 'wadigital792@gmail.com'
on conflict (user_id) do nothing;
