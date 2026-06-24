alter table public.notes
    alter column error_id drop not null,
    add column if not exists project_id uuid references public.projects(id) on delete cascade,
    add column if not exists kind text not null default 'error' check (kind in ('error', 'project'));

alter table public.notes
    add constraint notes_target_check
    check (
        (kind = 'error' and error_id is not null and project_id is null)
        or
        (kind = 'project' and error_id is null and project_id is not null)
    );

drop policy if exists "Users can manage notes for own errors" on public.notes;

create policy "Users can manage error notes"
on public.notes for all
using (
  kind = 'error'
  and exists (
    select 1
    from public.errors
    join public.projects on projects.id = errors.project_id
    where errors.id = notes.error_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  kind = 'error'
  and exists (
    select 1
    from public.errors
    join public.projects on projects.id = errors.project_id
    where errors.id = notes.error_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can manage project notes"
on public.notes for all
using (
  kind = 'project'
  and exists (
    select 1
    from public.projects
    where projects.id = notes.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  kind = 'project'
  and exists (
    select 1
    from public.projects
    where projects.id = notes.project_id
      and projects.owner_id = auth.uid()
  )
);

create index if not exists notes_project_id_idx on public.notes(project_id);
create index if not exists notes_kind_idx on public.notes(kind);
