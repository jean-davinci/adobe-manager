-- ============================================================
-- Davinci Labs — Módulo 3: CRM integrado con WhatsApp
-- ============================================================

create table if not exists contactos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references usuarios(id) on delete set null,
  nombre     text not null,
  telefono   text unique not null,
  email      text,
  etiquetas  text[] not null default '{}',
  notas      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_contactos_updated_at on contactos;
create trigger trg_contactos_updated_at
  before update on contactos
  for each row execute function set_updated_at();

create table if not exists mensajes (
  id         uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references contactos(id) on delete cascade,
  origen     text not null,   -- CLIENTE | OPERADOR | AUTO
  tipo       text not null default 'TEXTO',  -- TEXTO | IMAGEN | TEMPLATE
  contenido  text not null,
  media_url  text,
  leido      boolean not null default false,
  timestamp  timestamptz not null default now()
);

create index if not exists idx_mensajes_contacto on mensajes (contacto_id, timestamp);
create index if not exists idx_mensajes_no_leidos on mensajes (contacto_id) where leido = false;

create table if not exists respuestas_rapidas (
  id        uuid primary key default gen_random_uuid(),
  trigger   text unique not null,   -- ej: /informe
  texto     text not null,
  media_url text,
  created_at timestamptz not null default now()
);
