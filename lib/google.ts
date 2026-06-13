import 'server-only';
import { google } from 'googleapis';

// Cliente OAuth2 compartido por Gmail y Drive. Usa un refresh token de larga
// duración de la cuenta davincilabs.peru@gmail.com. Acepta los nombres de
// variable del proyecto (GOOGLE_*) o los del brief (GMAIL_*).
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

// ¿Hay credenciales suficientes para hablar con Google de verdad?
export function googleConfigurado(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN);
}

export function getOAuth2Client() {
  if (!googleConfigurado()) {
    throw new Error('Google OAuth no configurado (faltan CLIENT_ID/SECRET/REFRESH_TOKEN).');
  }
  const oauth2 = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
  );
  oauth2.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oauth2;
}

export function getGmailClient() {
  return google.gmail({ version: 'v1', auth: getOAuth2Client() });
}

export function getDriveClient() {
  return google.drive({ version: 'v3', auth: getOAuth2Client() });
}

export function getCalendarClient() {
  return google.calendar({ version: 'v3', auth: getOAuth2Client() });
}
