import 'server-only';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { googleConfigurado, getDriveClient } from './google';
import { esMock } from './mock';

// Integración con Google Drive. Usa la Drive API v3 cuando hay credenciales de
// Google y el modo mock no está forzado; si no, simula la sincronización.
function isMock(): boolean {
  return esMock('MOCK_DRIVE', googleConfigurado() && !!process.env.GOOGLE_DRIVE_FOLDER_ID);
}

export type DriveResult = { fileId: string; url: string; mock: boolean };

// Asegura una jerarquía de carpetas "A/B/C" bajo el folder raíz; devuelve el id final.
async function asegurarCarpeta(ruta: string): Promise<string | undefined> {
  const drive = getDriveClient();
  let padre = process.env.GOOGLE_DRIVE_FOLDER_ID || 'root';
  for (const nombre of ruta.split('/').filter(Boolean)) {
    const q = `name='${nombre.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${padre}' in parents and trashed=false`;
    const exist = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
    if (exist.data.files && exist.data.files.length > 0) {
      padre = exist.data.files[0].id!;
    } else {
      const creada = await drive.files.create({
        requestBody: { name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [padre] },
        fields: 'id',
      });
      padre = creada.data.id!;
    }
  }
  return padre;
}

// Sube/sincroniza un archivo local a una carpeta de Drive. No bloquear la UI.
export async function syncToDrive(filePath: string, driveFolder: string): Promise<DriveResult> {
  if (isMock()) {
    const fakeId = 'mock_' + Buffer.from(filePath).toString('base64url').slice(0, 16);
    console.log(`[MOCK syncToDrive] ${filePath} -> Drive/${driveFolder}`);
    return { fileId: fakeId, url: `https://drive.google.com/file/d/${fakeId}/view`, mock: true };
  }

  const drive = getDriveClient();
  const parent = await asegurarCarpeta(driveFolder);
  const res = await drive.files.create({
    requestBody: { name: basename(filePath), parents: parent ? [parent] : undefined },
    media: { body: createReadStream(filePath) },
    fields: 'id, webViewLink',
  });
  const fileId = res.data.id!;
  return { fileId, url: res.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`, mock: false };
}

// Genera un enlace público de solo lectura para previsualización.
export async function shareFilePublic(fileId: string): Promise<string> {
  if (isMock()) {
    console.log(`[MOCK shareFilePublic] ${fileId}`);
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  const drive = getDriveClient();
  await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' } });
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function isMockDrive() {
  return isMock();
}
