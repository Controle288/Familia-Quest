-- Adiciona a coluna completed_at às tarefas para suportar o reset de
-- missões recorrentes (diárias/semanais). Guarda o instante real em que a
-- tarefa foi aprovada/concluída, permitindo saber se o ciclo já virou.
alter table public.tasks
  add column if not exists completed_at timestamptz;

create index if not exists tasks_completed_at_idx
  on public.tasks (family_id, completed_at);
