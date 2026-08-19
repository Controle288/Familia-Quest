-- ============================================================
-- FamiliaQuest — Comprovante de foto nas tarefas (Supabase Storage)
-- Execute este script UMA vez no SQL Editor do seu projeto Supabase.
-- Convenção de caminho: <family_id>/<profile_id>/<arquivo>
-- ============================================================

-- Coluna que guarda a URL pública do comprovante
alter table public.tasks
  add column if not exists proof_url text;

-- Bucket público para os comprovantes (leitura livre via URL)
insert into storage.buckets (id, name, public)
values ('task-proofs', 'task-proofs', true)
on conflict (id) do nothing;

-- Upload permitido apenas dentro da pasta da própria família
drop policy if exists "task-proofs insert by family" on storage.objects;
create policy "task-proofs insert by family" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-proofs'
    and (storage.foldername(name))[1] = (
      select p.family_id
      from public.profiles p
      where p.user_id = auth.uid()::text
      limit 1
    )
  );

-- Atualização/remoção também restritas à própria família
drop policy if exists "task-proofs update by family" on storage.objects;
create policy "task-proofs update by family" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'task-proofs'
    and (storage.foldername(name))[1] = (
      select p.family_id
      from public.profiles p
      where p.user_id = auth.uid()::text
      limit 1
    )
  );

drop policy if exists "task-proofs delete by family" on storage.objects;
create policy "task-proofs delete by family" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'task-proofs'
    and (storage.foldername(name))[1] = (
      select p.family_id
      from public.profiles p
      where p.user_id = auth.uid()::text
      limit 1
    )
  );
