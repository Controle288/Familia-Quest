-- Adiciona last_active à tabela de perfis para calcular a ofensiva diária
-- (streak) de forma confiável. Guarda a data (YYYY-MM-DD) do último dia em que
-- o membro teve ao menos uma tarefa aprovada.
alter table public.profiles
  add column if not exists last_active date;

create index if not exists profiles_last_active_idx
  on public.profiles (family_id, last_active);
