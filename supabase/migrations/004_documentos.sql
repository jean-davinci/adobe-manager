-- ============================================================
-- Davinci Labs — Módulo 2: Turnitin / Procesamiento de documentos
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'doc_estado') then
    create type doc_estado as enum ('RECIBIDO', 'EN_PROCESO', 'COMPLETADO');
  end if;
end$$;

create table if not exists documentos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references usuarios(id) on delete set null,
  cliente_nombre text not null,
  cliente_email  text,
  nombre_archivo text not null,
  tipo_servicio  text not null default 'AMBOS',  -- IA | SIMILITUD | AMBOS | TURNITIN_OFICIAL
  estado         doc_estado not null default 'RECIBIDO',
  tamano_bytes   bigint,
  url_local      text,
  url_drive      text,
  url_informe    text,
  informe_publico boolean not null default false,
  operador       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_documentos_estado     on documentos (estado);
create index if not exists idx_documentos_created     on documentos (created_at);
create index if not exists idx_documentos_user        on documentos (user_id);
create index if not exists idx_documentos_email       on documentos (cliente_email);

drop trigger if exists trg_documentos_updated_at on documentos;
create trigger trg_documentos_updated_at
  before update on documentos
  for each row execute function set_updated_at();
