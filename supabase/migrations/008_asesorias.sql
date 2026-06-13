-- ============================================================
-- Davinci Labs — Asesorías académicas (reserva + Google Calendar)
-- ============================================================

create table if not exists asesorias (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  email                text,
  telefono             text,
  fecha                date not null,
  hora_inicio          time not null,
  duracion_min         int not null default 60,
  estado               text not null default 'RESERVADA',  -- RESERVADA | CANCELADA | COMPLETADA
  notas                text,
  precio               numeric(10,2),
  calendar_event_id    text,
  recordatorio_enviado boolean not null default false,
  created_at           timestamptz not null default now()
);

create index if not exists idx_asesorias_fecha on asesorias (fecha, hora_inicio);
-- Un mismo horario no puede reservarse dos veces (las canceladas liberan el cupo).
create unique index if not exists uq_asesorias_slot
  on asesorias (fecha, hora_inicio) where estado = 'RESERVADA';
