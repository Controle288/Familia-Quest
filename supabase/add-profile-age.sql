-- ============================================================================
-- Adiciona a coluna "age" (idade em anos) na tabela profiles, usada para
-- selecionar o dashboard adaptativo do filho (Kids <=9, Teen 10-14, Clean 15+).
-- Execute uma única vez no SQL Editor do Supabase.
-- ============================================================================

alter table public.profiles add column if not exists age integer;
