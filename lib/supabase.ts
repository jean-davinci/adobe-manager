import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type ClienteAdobe = {
  id: string;
  numero_pedido: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono: string;
  plan_duracion: number;
  costo_servicio: number;
  email_adobe: string;
  contraseña_adobe_encriptada: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE_PAGO';
  fecha_compra: string;
  fecha_renovacion_proxima: string;
  created_at: string;
  updated_at: string;
};
