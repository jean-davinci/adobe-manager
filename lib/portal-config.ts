// Configuración pública del portal — importable desde client y server components.
export const PAQUETES: Record<string, { label: string; cantidad: number; monto: number; ahorro?: number }> = {
  basico:      { label: 'Básico',      cantidad: 1,  monto: 15  },
  estandar:    { label: 'Estándar',    cantidad: 3,  monto: 40,  ahorro: 5  },
  premium:     { label: 'Premium',     cantidad: 5,  monto: 60,  ahorro: 15 },
  empresarial: { label: 'Empresarial', cantidad: 10, monto: 100, ahorro: 50 },
};
