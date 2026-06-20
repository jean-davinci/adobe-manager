-- ============================================================
-- Davinci Labs — Portal de Cliente (self-service)
-- ============================================================

-- Saldo de créditos por cliente
CREATE TABLE IF NOT EXISTS creditos_cliente (
  usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  saldo INTEGER NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solicitudes de compra de créditos (se confirman manualmente o via webhook)
CREATE TABLE IF NOT EXISTS compras_creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  paquete TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  monto NUMERIC(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmado', 'rechazado')),
  imagen_url TEXT,
  referencia TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_compras_usuario ON compras_creditos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compras_estado ON compras_creditos(estado);

-- Cola de pedidos Turnitin (self-service)
CREATE TABLE IF NOT EXISTS pedidos_turnitin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  nombre_archivo TEXT NOT NULL,
  archivo_url TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'procesando', 'completado', 'error')),
  similitud_pct INTEGER,
  ia_pct INTEGER,
  palabras INTEGER,
  reporte_url TEXT,
  creditos_usados INTEGER NOT NULL DEFAULT 1,
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos_turnitin(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos_turnitin(estado);

-- Acceso segmentado: qué servicios tiene habilitados cada cliente
CREATE TABLE IF NOT EXISTS acceso_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servicio TEXT NOT NULL CHECK (servicio IN ('turnitin', 'adobe')),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  otorgado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, servicio)
);

-- Cuentas Adobe asignadas por el admin al cliente
CREATE TABLE IF NOT EXISTS cuentas_adobe_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  email_adobe TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'Creative Cloud',
  fecha_inicio DATE,
  fecha_vencimiento DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id)
);
