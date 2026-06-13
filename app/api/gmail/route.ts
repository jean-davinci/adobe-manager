import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { requireApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireApi('ADMIN', 'OPERATOR');
  if (!auth.ok) return auth.response;

  try {
    const { access_token } = await req.json();

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Buscar emails de Adobe en los últimos 10 minutos
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'from:adobe.com subject:código OR subject:code OR subject:verification newer_than:1h',
      maxResults: 5,
    });

    const messages = response.data.messages || [];
    const emails = [];

    for (const msg of messages.slice(0, 3)) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      });

      const headers = detail.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      // Extraer body
      let body = '';
      const parts = detail.data.payload?.parts || [];
      if (parts.length > 0) {
        const textPart = parts.find(p => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (detail.data.payload?.body?.data) {
        body = Buffer.from(detail.data.payload.body.data, 'base64').toString('utf-8');
      }

      // Extraer código de 6 dígitos
      const codeMatch = body.match(/\b\d{6}\b/);
      const code = codeMatch ? codeMatch[0] : null;

      emails.push({ subject, from, date, code, body: body.slice(0, 300) });
    }

    return NextResponse.json({ emails });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
