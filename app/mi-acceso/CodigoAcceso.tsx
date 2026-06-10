'use client';

import { useState } from 'react';

export default function CodigoAcceso({ email, password }: { email: string; password: string }) {
  const [verPass, setVerPass] = useState(false);
  const [copiado, setCopiado] = useState('');

  const copiar = (valor: string, cual: string) => {
    navigator.clipboard.writeText(valor);
    setCopiado(cual);
    setTimeout(() => setCopiado(''), 1500);
  };

  return (
    <div className="space-y-2">
      <Fila label="Correo Adobe" valor={email} onCopy={() => copiar(email, 'email')} copiado={copiado === 'email'} />
      <Fila
        label="Contraseña"
        valor={verPass ? password : '•'.repeat(Math.max(password.length, 8))}
        onCopy={() => copiar(password, 'pass')}
        copiado={copiado === 'pass'}
        extra={
          <button onClick={() => setVerPass((v) => !v)} className="text-xs text-gray-400 hover:text-gray-700">
            {verPass ? 'Ocultar' : 'Mostrar'}
          </button>
        }
      />
    </div>
  );
}

function Fila({ label, valor, onCopy, copiado, extra }: {
  label: string; valor: string; onCopy: () => void; copiado: boolean; extra?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900 font-mono truncate">{valor}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {extra}
        <button onClick={onCopy} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
