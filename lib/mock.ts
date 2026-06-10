import 'server-only';

// Decide si un servicio corre en modo MOCK.
// Reglas (de mayor a menor prioridad):
//  1. Sin credenciales -> siempre mock.
//  2. Override por servicio MOCK_<SERVICIO> = 'true' | 'false' -> manda.
//  3. Si no hay override, usa el global MOCK_MODE.
export function esMock(overrideKey: string, hasCreds: boolean): boolean {
  if (!hasCreds) return true;
  const o = process.env[overrideKey];
  if (o === 'true') return true;
  if (o === 'false') return false;
  return process.env.MOCK_MODE === 'true';
}
