-- Verificación manual de RLS (SC-005): una cuenta no puede leer ni escribir filas de otra.
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de la migración.
--
-- Antes de ejecutar: buscar dos cuentas de prueba y reemplazar en TODO este archivo
--   <UUID_A> y <UUID_B>  por sus ids (Buscar y reemplazar):
--   select id, email from auth.users order by created_at desc limit 5;
--
-- Cada paso lanza un error si algo está mal ("FALLO: ...") y un aviso "OK" si está bien.
-- Todo se revierte al final (rollback): no deja datos.

begin;

-- 1) La cuenta A inserta una fila suya: debe funcionar.
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"<UUID_A>","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.diagnosticos_emprendedor (user_id, answers, scores, dominant)
  values (
    '<UUID_A>',
    (select jsonb_object_agg(b || '.' || n, 3) from generate_series(1, 9) b, generate_series(1, 5) n),
    '{"realista-gerencial":27,"realizador-comerciante":34,"artistico-imaginativo":26,"movilizador-social":25,"investigativo-creador":30}'::jsonb,
    array['realizador-comerciante']
  );
  raise notice 'OK 1: A pudo insertar una fila propia';
end $$;

-- 2) La cuenta A intenta insertar una fila a nombre de B: debe ser rechazada por RLS.
do $$
declare rechazado boolean := false;
begin
  perform set_config('request.jwt.claims', '{"sub":"<UUID_A>","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.diagnosticos_emprendedor (user_id, answers, scores, dominant)
    values (
      '<UUID_B>',
      (select jsonb_object_agg(b || '.' || n, 3) from generate_series(1, 9) b, generate_series(1, 5) n),
      '{"a":1,"b":1,"c":1,"d":1,"e":1}'::jsonb,
      array['realista-gerencial']
    );
  exception when insufficient_privilege then
    rechazado := true;
  end;
  if not rechazado then raise exception 'FALLO 2: A pudo insertar una fila a nombre de B'; end if;
  raise notice 'OK 2: RLS rechazó insertar a nombre de otra cuenta';
end $$;

-- 3) La cuenta B no ve la fila de A.
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"<UUID_B>","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.diagnosticos_emprendedor;
  if n <> 0 then raise exception 'FALLO 3: B ve % filas que no son suyas', n; end if;
  raise notice 'OK 3: B no ve filas de A';
end $$;

-- 4) La cuenta A sí ve la suya (una fila).
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"<UUID_A>","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.diagnosticos_emprendedor;
  if n <> 1 then raise exception 'FALLO 4: A debería ver 1 fila y ve %', n; end if;
  raise notice 'OK 4: A ve su fila';
end $$;

-- 5) Sin sesión (anon) no hay acceso.
do $$
declare denegado boolean := false; n integer;
begin
  set local role anon;
  begin
    select count(*) into n from public.diagnosticos_emprendedor;
  exception when insufficient_privilege then
    denegado := true;
  end;
  if not denegado then raise exception 'FALLO 5: anon pudo consultar la tabla'; end if;
  raise notice 'OK 5: anon no tiene acceso';
end $$;

rollback;
