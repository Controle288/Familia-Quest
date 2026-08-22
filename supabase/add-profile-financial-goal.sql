-- ============================================================================
-- Adiciona a coluna "financial_goal" (meta de economia) na tabela profiles,
-- usada pelo modo Young Adult / Clean do dashboard do filho.
-- Execute uma única vez no SQL Editor do Supabase.
-- ============================================================================

alter table public.profiles add column if not exists financial_goal jsonb;
