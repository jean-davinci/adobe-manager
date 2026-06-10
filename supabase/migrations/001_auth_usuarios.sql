-- ============================================================
-- Davinci Labs — Módulo de Autenticación y Roles
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Tipo de rol
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rol_usuario') then
    create type rol_usuario as enum ('ADMIN', 'OPERATOR', 'CLIENT');
  end if;
end$$;

-- Tabla de usuarios (login único con roles)
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  nombre        text not null,
  password_hash text not null,
  rol           rol_usuario not null default 'CLIENT',
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_usuarios_email on usuarios (email);

-- Trigger para mantener updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_usuarios_updated_at on usuarios;
create trigger trg_usuarios_updated_at
  before update on usuarios
  for each row execute function set_updated_at();

-- RLS: la tabla solo se accede desde el servidor con la service role key,
-- que ignora RLS. Habilitamos RLS sin políticas para bloquear el acceso
-- con la anon key (clientes nunca leen esta tabla directamente).
alter table usuarios enable row level security;
