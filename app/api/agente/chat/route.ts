import { NextRequest, NextResponse } from 'next/server';
import { requireApi } from '@/lib/api-auth';
import { rateLimit, clienteIP } from '@/lib/rate-limit';
import { chatDavinci, historialChatDavinci } from '@/lib/agente-acciones';
import { validarImagenBase64, configurado } from '@/lib/agente-davinci';

// GET /api/agente/chat — historial del operador
export async function GET() {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  const historial = await historialChatDavinci(auth.session.userId, 50);
  return NextResponse.json({ historial, configurado: configurado() });
}

// POST /api/agente/chat { prompt, imagen?: { base64, mimeType } }
export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;
  // Anti-spam: 30 turnos por minuto por operador.
  const ip = clienteIP(req.headers);
  const limite = rateLimit(`agente-chat:${auth.session.userId}:${ip}`, 30, 60 * 1000);
  if (!limite.ok) {
    return NextResponse.json(
      { error: `Demasiados mensajes. Intenta en ${limite.retryAfter}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const prompt = String(body?.prompt ?? '').trim();
    if (!prompt) return NextResponse.json({ error: 'Falta prompt' }, { status: 400 });
    if (prompt.length > 4000) return NextResponse.json({ error: 'Prompt muy largo' }, { status: 400 });

    let imagen: { mimeType: string; base64: string } | undefined;
    if (body?.imagen?.base64 && body?.imagen?.mimeType) {
      const v = validarImagenBase64(body.imagen.base64, body.imagen.mimeType);
      if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
      imagen = body.imagen;
    }

    const r = await chatDavinci(auth.session.userId, prompt, imagen);
    return NextResponse.json(r);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
