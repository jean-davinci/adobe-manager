// Tipos compartidos del portal — sin imports de servidor, importable desde client components.

export type CreditosCliente = {
  usuario_id: string;
  saldo: number;
  updated_at: string;
};

export type CompraCreditos = {
  id: string;
  usuario_id: string;
  paquete: string;
  cantidad: number;
  monto: string;
  estado: 'pendiente' | 'confirmado' | 'rechazado';
  imagen_url: string | null;
  referencia: string | null;
  notas: string | null;
  created_at: string;
  confirmado_at: string | null;
};

export type PedidoTurnitin = {
  id: string;
  usuario_id: string;
  nombre_archivo: string;
  archivo_url: string;
  estado: 'pendiente' | 'procesando' | 'completado' | 'error';
  similitud_pct: number | null;
  ia_pct: number | null;
  palabras: number | null;
  reporte_url: string | null;
  creditos_usados: number;
  error_msg: string | null;
  created_at: string;
  completado_at: string | null;
};

export type AccesoServicio = {
  id: string;
  usuario_id: string;
  servicio: 'turnitin' | 'adobe';
  activo: boolean;
  created_at: string;
};

export type CuentaAdobeCliente = {
  id: string;
  usuario_id: string;
  email_adobe: string;
  plan: string;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
};
