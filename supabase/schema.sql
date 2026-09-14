-- =====================================================================
-- MiEmpresa — esquema multi-empresa (mantenimiento + calidad)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- ============================== CATALOGOS =============================

create table if not exists organizaciones (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  logo_url text,
  color text not null default '#2563eb',
  modulos jsonb not null default '{"mantenimiento": true, "calidad": true}'::jsonb,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  nombre text not null,
  tiene_preventivo boolean not null default true,
  activa boolean not null default true,
  orden integer not null default 0,
  unique (organizacion_id, nombre)
);

create table if not exists personal (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  nombre text not null,
  cargo text,
  area text,
  cedula text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table if not exists usuarios_portal (
  id uuid primary key references auth.users (id) on delete cascade,
  organizacion_id uuid references organizaciones (id) on delete cascade,
  usuario text,
  email text not null,
  nombre text not null default '',
  rol text not null default 'operador'
    check (rol in ('plataforma', 'admin', 'operador', 'consulta', 'solicitante', 'lider', 'gerencia')),
  personal_id uuid references personal (id) on delete set null,
  area text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint usuarios_plataforma_sin_org check (
    (rol = 'plataforma' and organizacion_id is null)
    or (rol <> 'plataforma' and organizacion_id is not null)
  )
);

create unique index if not exists idx_usuarios_portal_email on usuarios_portal (lower(email));
create unique index if not exists idx_usuarios_org_usuario
  on usuarios_portal (organizacion_id, usuario)
  where usuario is not null;
create index if not exists idx_usuarios_portal_org on usuarios_portal (organizacion_id);
create index if not exists idx_usuarios_portal_rol on usuarios_portal (rol);

-- ============================== NEGOCIO ===============================

create table if not exists hojas_vida (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  codigo text,
  nombre text not null,
  area text not null,
  frecuencia_pm_meses integer,
  primer_pm date,
  activa boolean not null default true,
  foto_url text,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists preventivo (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  hoja_id uuid references hojas_vida (id) on delete set null,
  personal_id uuid references personal (id) on delete set null,
  area text not null,
  fecha date not null,
  descripcion text,
  adjunto_url text,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists correctivo (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  personal_id uuid references personal (id) on delete set null,
  area text not null,
  fecha date not null,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists cronograma (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  hoja_id uuid not null references hojas_vida (id) on delete cascade,
  fecha date not null,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create table if not exists cronograma_excepciones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  fecha date not null,
  motivo text,
  creado_en timestamptz not null default now()
);

create table if not exists horas_programadas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  periodo text not null,
  area text not null,
  horas numeric not null default 0,
  unique (organizacion_id, periodo, area)
);

create table if not exists no_conformidades (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  numero bigint generated by default as identity,
  pdf_url text,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  unique (organizacion_id, numero)
);

create table if not exists acciones_mejora (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  numero bigint generated by default as identity,
  pdf_url text,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  unique (organizacion_id, numero)
);

create table if not exists gestion_cambio (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references organizaciones (id) on delete cascade,
  numero bigint generated by default as identity,
  datos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now(),
  unique (organizacion_id, numero)
);

create index if not exists idx_hojas_org on hojas_vida (organizacion_id);
create index if not exists idx_preventivo_org on preventivo (organizacion_id);
create index if not exists idx_correctivo_org on correctivo (organizacion_id);
create index if not exists idx_cronograma_org on cronograma (organizacion_id);
create index if not exists idx_nc_org on no_conformidades (organizacion_id);
create index if not exists idx_am_org on acciones_mejora (organizacion_id);
create index if not exists idx_gc_org on gestion_cambio (organizacion_id);
create index if not exists idx_personal_org on personal (organizacion_id);
create index if not exists idx_areas_org on areas (organizacion_id);

-- ============================== HELPERS RLS ===========================

create or replace function public.usuario_rol()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rol from usuarios_portal where id = auth.uid() and activo = true),
    ''
  );
$$;

create or replace function public.usuario_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organizacion_id from usuarios_portal where id = auth.uid() and activo = true;
$$;

create or replace function public.usuario_es_plataforma()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() = 'plataforma';
$$;

create or replace function public.usuario_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() in ('plataforma', 'admin');
$$;

create or replace function public.usuario_puede_escribir()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_rol() in ('plataforma', 'admin', 'operador', 'solicitante', 'lider');
$$;

create or replace function public.usuario_autenticado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and public.usuario_rol() <> '';
$$;

create or replace function public.misma_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.usuario_es_plataforma()
    or (p_org is not null and p_org = public.usuario_org_id());
$$;

grant execute on function public.usuario_rol() to anon, authenticated;
grant execute on function public.usuario_org_id() to anon, authenticated;
grant execute on function public.usuario_es_plataforma() to anon, authenticated;
grant execute on function public.usuario_es_admin() to anon, authenticated;
grant execute on function public.usuario_puede_escribir() to anon, authenticated;
grant execute on function public.usuario_autenticado() to anon, authenticated;
grant execute on function public.misma_org(uuid) to anon, authenticated;

-- Login por usuario + slug de empresa (o correo completo)
create or replace function public.email_auth_por_login(p_login text, p_slug text default null)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_login text := lower(trim(p_login));
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_email text;
begin
  if v_login is null or v_login = '' then
    return null;
  end if;

  if position('@' in v_login) > 0 then
    select email into v_email
    from usuarios_portal
    where activo = true and lower(email) = v_login
    limit 1;
    return v_email;
  end if;

  if v_slug <> '' then
    select u.email into v_email
    from usuarios_portal u
    join organizaciones o on o.id = u.organizacion_id
    where u.activo = true
      and o.activa = true
      and lower(u.usuario) = v_login
      and o.slug = v_slug
    limit 1;
    return v_email;
  end if;

  select email into v_email
  from usuarios_portal
  where activo = true
    and rol = 'plataforma'
    and lower(usuario) = v_login
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.email_auth_por_login(text, text) to anon, authenticated;

-- ============================== RLS ===================================

alter table organizaciones enable row level security;
alter table areas enable row level security;
alter table personal enable row level security;
alter table usuarios_portal enable row level security;
alter table hojas_vida enable row level security;
alter table preventivo enable row level security;
alter table correctivo enable row level security;
alter table cronograma enable row level security;
alter table cronograma_excepciones enable row level security;
alter table horas_programadas enable row level security;
alter table no_conformidades enable row level security;
alter table acciones_mejora enable row level security;
alter table gestion_cambio enable row level security;

drop policy if exists "orgs leer" on organizaciones;
create policy "orgs leer" on organizaciones
  for select using (
    public.usuario_es_plataforma()
    or id = public.usuario_org_id()
  );

drop policy if exists "orgs escribir plataforma" on organizaciones;
create policy "orgs escribir plataforma" on organizaciones
  for all using (public.usuario_es_plataforma())
  with check (public.usuario_es_plataforma());

drop policy if exists "orgs admin actualiza" on organizaciones;
create policy "orgs admin actualiza" on organizaciones
  for update using (public.usuario_rol() = 'admin' and id = public.usuario_org_id())
  with check (public.usuario_rol() = 'admin' and id = public.usuario_org_id());

drop policy if exists "areas leer" on areas;
create policy "areas leer" on areas
  for select using (public.misma_org(organizacion_id));

drop policy if exists "areas escribir" on areas;
create policy "areas escribir" on areas
  for all using (public.usuario_es_admin() and public.misma_org(organizacion_id))
  with check (public.usuario_es_admin() and public.misma_org(organizacion_id));

drop policy if exists "usuarios leer" on usuarios_portal;
create policy "usuarios leer" on usuarios_portal
  for select using (
    id = auth.uid()
    or public.usuario_es_plataforma()
    or (public.usuario_rol() = 'admin' and organizacion_id = public.usuario_org_id())
  );

drop policy if exists "usuarios admin gestiona" on usuarios_portal;
create policy "usuarios admin gestiona" on usuarios_portal
  for all using (
    public.usuario_es_plataforma()
    or (public.usuario_rol() = 'admin' and organizacion_id = public.usuario_org_id())
  )
  with check (
    public.usuario_es_plataforma()
    or (public.usuario_rol() = 'admin' and organizacion_id = public.usuario_org_id())
  );

drop policy if exists "tenant leer" on personal;
create policy "tenant leer" on personal
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on personal;
create policy "tenant escribir" on personal
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on hojas_vida;
create policy "tenant leer" on hojas_vida
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on hojas_vida;
create policy "tenant escribir" on hojas_vida
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on preventivo;
create policy "tenant leer" on preventivo
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on preventivo;
create policy "tenant escribir" on preventivo
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on correctivo;
create policy "tenant leer" on correctivo
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on correctivo;
create policy "tenant escribir" on correctivo
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on cronograma;
create policy "tenant leer" on cronograma
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on cronograma;
create policy "tenant escribir" on cronograma
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on cronograma_excepciones;
create policy "tenant leer" on cronograma_excepciones
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on cronograma_excepciones;
create policy "tenant escribir" on cronograma_excepciones
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on horas_programadas;
create policy "tenant leer" on horas_programadas
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on horas_programadas;
create policy "tenant escribir" on horas_programadas
  for all using (public.usuario_es_admin() and public.misma_org(organizacion_id))
  with check (public.usuario_es_admin() and public.misma_org(organizacion_id));

drop policy if exists "tenant leer" on no_conformidades;
create policy "tenant leer" on no_conformidades
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on no_conformidades;
create policy "tenant escribir" on no_conformidades
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on acciones_mejora;
create policy "tenant leer" on acciones_mejora
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on acciones_mejora;
create policy "tenant escribir" on acciones_mejora
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

drop policy if exists "tenant leer" on gestion_cambio;
create policy "tenant leer" on gestion_cambio
  for select using (public.misma_org(organizacion_id) and public.usuario_autenticado());

drop policy if exists "tenant escribir" on gestion_cambio;
create policy "tenant escribir" on gestion_cambio
  for all using (public.misma_org(organizacion_id) and public.usuario_puede_escribir())
  with check (public.misma_org(organizacion_id) and public.usuario_puede_escribir());

-- Realtime (solicitudes / PM)
alter table correctivo replica identity full;
alter table preventivo replica identity full;
alter table hojas_vida replica identity full;

-- ============================== STORAGE ===============================

insert into storage.buckets (id, name, public)
values ('adjuntos', 'adjuntos', true)
on conflict (id) do nothing;

drop policy if exists "leer adjuntos" on storage.objects;
create policy "leer adjuntos" on storage.objects
  for select using (bucket_id = 'adjuntos');

drop policy if exists "subir adjuntos" on storage.objects;
create policy "subir adjuntos" on storage.objects
  for insert with check (bucket_id = 'adjuntos' and public.usuario_autenticado());

drop policy if exists "actualizar adjuntos" on storage.objects;
create policy "actualizar adjuntos" on storage.objects
  for update using (bucket_id = 'adjuntos' and public.usuario_autenticado())
  with check (bucket_id = 'adjuntos' and public.usuario_autenticado());

drop policy if exists "borrar adjuntos" on storage.objects;
create policy "borrar adjuntos" on storage.objects
  for delete using (bucket_id = 'adjuntos' and public.usuario_es_admin());

-- ============================== SEMILLA ===============================
-- 1) Authentication → Users → crear tu usuario plataforma (correo real).
-- 2) Sustituye el UUID y ejecuta:
--
-- insert into usuarios_portal (id, organizacion_id, usuario, email, nombre, rol, activo)
-- values (
--   'UUID-DE-AUTH-USERS',
--   null,
--   'plataforma',
--   'tu-correo@dominio.com',
--   'Plataforma MiEmpresa',
--   'plataforma',
--   true
-- );
