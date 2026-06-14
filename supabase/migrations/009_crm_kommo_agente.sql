-- ============================================================
-- Davinci Labs — CRM tipo Kommo + Agente Davinci (Claude API)
-- ============================================================

-- 1. Pipeline: etapa por contacto
alter table contactos add column if not exists etapa text not null default 'Nuevo';
create index if not exists idx_contactos_etapa on contactos (etapa);

-- 2. Mensajes: nuevos tipos para Yape y documentos. La columna `tipo` ya
-- existía como text libre; añadimos check suave para mantener consistencia
-- sin romper data vieja.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'mensajes' and column_name = 'metadata'
  ) then
    alter table mensajes add column metadata jsonb;
  end if;
end$$;

-- 3. Pagos Yape detectados por el agente
create table if not exists pagos_yape (
  id                     uuid primary key default gen_random_uuid(),
  contacto_id            uuid references contactos(id) on delete set null,
  monto                  numeric(10, 2) not null,
  pagador                text,
  fecha_pago             date not null default current_date,
  imagen_url             text,
  registrado_en_finanzas boolean not null default false,
  transaccion_id         uuid references transacciones(id) on delete set null,
  created_at             timestamptz not null default now()
);
create index if not exists idx_pagos_yape_fecha on pagos_yape (fecha_pago);
create index if not exists idx_pagos_yape_contacto on pagos_yape (contacto_id);

-- 4. Reportes diarios del agente Davinci
create table if not exists reportes_agente (
  id            uuid primary key default gen_random_uuid(),
  fecha         date not null unique,
  contenido     text not null,
  metricas      jsonb,
  generado_en   timestamptz not null default now()
);

-- 5. Historial de chat operador ↔ agente (memoria de la sesión)
create table if not exists agente_mensajes (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid references usuarios(id) on delete cascade,
  rol          text not null check (rol in ('user', 'assistant')),
  contenido    text not null,
  contexto     jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_agente_mensajes_usuario on agente_mensajes (usuario_id, created_at);

-- 6. Avisos proactivos del agente (alertas no leídas)
create table if not exists agente_avisos (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null,   -- 'sin_respuesta' | 'pago_pendiente' | 'cliente_inactivo' | 'pico' | 'otro'
  severidad     text not null default 'info',  -- 'info' | 'warn' | 'urgente'
  titulo        text not null,
  detalle       text,
  contacto_id   uuid references contactos(id) on delete cascade,
  metadata      jsonb,
  visto         boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_agente_avisos_visto on agente_avisos (visto, created_at desc);
