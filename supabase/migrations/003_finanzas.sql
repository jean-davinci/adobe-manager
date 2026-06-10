-- ============================================================
-- Davinci Labs — Módulo 4: Control de Ingresos y Egresos
-- ============================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tipo_tx') then
    create type tipo_tx as enum ('INGRESO', 'EGRESO');
  end if;
end$$;

-- ---------- Proveedores ----------
create table if not exists proveedores (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  servicio      text,
  costo_por_uso numeric(10,2),
  umbral_alerta numeric(10,2),
  created_at    timestamptz not null default now()
);

-- ---------- Transacciones ----------
create table if not exists transacciones (
  id             uuid primary key default gen_random_uuid(),
  tipo           tipo_tx not null,
  categoria      text not null,
  monto          numeric(12,2) not null,
  moneda         text not null default 'PEN',
  descripcion    text,
  cliente_nombre text,
  proveedor_id   uuid references proveedores(id) on delete set null,
  comprobante_url text,
  fecha          date not null default current_date,
  created_at     timestamptz not null default now()
);

create index if not exists idx_transacciones_fecha     on transacciones (fecha);
create index if not exists idx_transacciones_tipo      on transacciones (tipo);
create index if not exists idx_transacciones_categoria on transacciones (categoria);
