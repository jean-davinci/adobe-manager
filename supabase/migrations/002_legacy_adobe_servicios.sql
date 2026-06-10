-- ============================================================
-- Davinci Labs — Tablas legacy migradas a Postgres
-- Módulo 1 (Adobe/Afiliados) + Servicios + Proyectos de tesis
-- ============================================================

-- ---------- Clientes Adobe (afiliados) ----------
create table if not exists clientes_adobe (
  id                            uuid primary key default gen_random_uuid(),
  numero_pedido                 text unique not null,
  nombre_cliente                text not null,
  email_cliente                 text,
  telefono                      text default '',
  plan_duracion                 int not null default 1,
  costo_servicio                numeric(10,2) not null default 0,
  email_adobe                   text default '',
  "contraseña_adobe_encriptada" text default '',
  estado                        text not null default 'ACTIVO',
  fecha_compra                  date not null default current_date,
  fecha_renovacion_proxima      date,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

drop trigger if exists trg_clientes_adobe_updated_at on clientes_adobe;
create trigger trg_clientes_adobe_updated_at
  before update on clientes_adobe
  for each row execute function set_updated_at();

-- ---------- Servicios de clientes (Turnitin / IA / asesorías) ----------
create table if not exists servicios_clientes (
  id                     uuid primary key default gen_random_uuid(),
  tipo_servicio          text not null,
  nombre_cliente         text not null,
  email                  text,
  telefono               text,
  estado                 text not null default 'PENDIENTE',
  monto                  numeric(10,2) not null default 0,
  prioridad              text not null default 'NORMAL',
  fecha_entrega_esperada date,
  fecha_entrega_real     date,
  descripcion            text,
  porcentaje_actual      int default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

drop trigger if exists trg_servicios_clientes_updated_at on servicios_clientes;
create trigger trg_servicios_clientes_updated_at
  before update on servicios_clientes
  for each row execute function set_updated_at();

-- ---------- Proyectos de tesis ----------
create table if not exists proyectos_tesis (
  id                uuid primary key default gen_random_uuid(),
  nombre_alumno     text not null,
  carrera           text default 'Comunicación',
  curso_tesis       text,
  titulo_tesis      text,
  drive_link        text,
  j1_nota           numeric(4,2),
  j2_nota           numeric(4,2),
  j3_nota           numeric(4,2),
  j4_nota           numeric(4,2),
  porcentaje_avance int default 0,
  notas             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_proyectos_tesis_updated_at on proyectos_tesis;
create trigger trg_proyectos_tesis_updated_at
  before update on proyectos_tesis
  for each row execute function set_updated_at();

-- ---------- Etapas de tesis (estado por etapa) ----------
create table if not exists etapas_tesis (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid references proyectos_tesis(id) on delete cascade,
  nombre      text,
  estado      text default 'PENDIENTE',
  orden       int default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_etapas_tesis_updated_at on etapas_tesis;
create trigger trg_etapas_tesis_updated_at
  before update on etapas_tesis
  for each row execute function set_updated_at();
