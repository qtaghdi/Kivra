create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  github_id text not null unique,
  username text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  runtime text not null,
  framework text not null,
  package_manager text not null,
  branch text not null,
  repository_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  command text not null,
  status text not null check (status in ('SUCCESS', 'FAILED')),
  duration integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  level text not null check (level in ('INFO', 'WARN', 'ERROR', 'DEBUG')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.errors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id uuid not null references public.runs(id) on delete cascade,
  error_code text not null,
  message text not null,
  file_path text,
  line_number integer,
  column_number integer,
  stack_trace text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  error_id uuid not null references public.errors(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.runs enable row level security;
alter table public.logs enable row level security;
alter table public.errors enable row level security;
alter table public.notes enable row level security;

create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

create policy "Users can upsert own profile"
on public.users for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can manage own projects"
on public.projects for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "Users can manage runs for own projects"
on public.runs for all
using (
  exists (
    select 1 from public.projects
    where projects.id = runs.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = runs.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can manage logs for own runs"
on public.logs for all
using (
  exists (
    select 1
    from public.runs
    join public.projects on projects.id = runs.project_id
    where runs.id = logs.run_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runs
    join public.projects on projects.id = runs.project_id
    where runs.id = logs.run_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can manage errors for own projects"
on public.errors for all
using (
  exists (
    select 1 from public.projects
    where projects.id = errors.project_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = errors.project_id
      and projects.owner_id = auth.uid()
  )
);

create policy "Users can manage notes for own errors"
on public.notes for all
using (
  exists (
    select 1
    from public.errors
    join public.projects on projects.id = errors.project_id
    where errors.id = notes.error_id
      and projects.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.errors
    join public.projects on projects.id = errors.project_id
    where errors.id = notes.error_id
      and projects.owner_id = auth.uid()
  )
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists runs_project_id_idx on public.runs(project_id);
create index if not exists logs_run_id_idx on public.logs(run_id);
create index if not exists errors_project_id_idx on public.errors(project_id);
create index if not exists errors_run_id_idx on public.errors(run_id);
create index if not exists notes_error_id_idx on public.notes(error_id);
