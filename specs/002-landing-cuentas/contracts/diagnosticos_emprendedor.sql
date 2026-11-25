-- Migración: resultados del Diagnóstico de perfil emprendedor.
-- Ejecutar en el SQL Editor de Supabase (primero en el proyecto de prueba, luego en producción).
-- No modifica ninguna tabla existente (perfiles, etc.). Es idempotente.

-- Postgres no admite subconsultas dentro de CHECK: se usa una función inmutable.
create or replace function public.diagnosticos_num_claves(j jsonb)
returns integer
language sql
immutable
as $$
  select case when jsonb_typeof(j) = 'object' then (select count(*)::integer from jsonb_object_keys(j)) else 0 end
$$;

create table if not exists public.diagnosticos_emprendedor (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  answers     jsonb not null,
  scores      jsonb not null,
  dominant    text[] not null,
  secondary   text[] not null default '{}',
  created_at  timestamptz not null default now(),
  constraint diagnosticos_answers_45 check (public.diagnosticos_num_claves(answers) = 45),
  constraint diagnosticos_scores_5 check (public.diagnosticos_num_claves(scores) = 5),
  constraint diagnosticos_dominant_no_vacio check (cardinality(dominant) >= 1)
);

create index if not exists diagnosticos_user_created_idx
  on public.diagnosticos_emprendedor (user_id, created_at desc);

alter table public.diagnosticos_emprendedor enable row level security;

-- Solo la propia persona, y solo para filas suyas. Sin update ni delete: es un historial.
drop policy if exists "diagnosticos_select_propios" on public.diagnosticos_emprendedor;
create policy "diagnosticos_select_propios"
  on public.diagnosticos_emprendedor
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "diagnosticos_insert_propios" on public.diagnosticos_emprendedor;
create policy "diagnosticos_insert_propios"
  on public.diagnosticos_emprendedor
  for insert to authenticated
  with check (user_id = auth.uid());

-- Privilegios mínimos: nada para anon; select e insert para authenticated.
revoke all on public.diagnosticos_emprendedor from anon, authenticated;
grant select, insert on public.diagnosticos_emprendedor to authenticated;
