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
      <Fila label="Correo Adobe" valor={email} onCopy={() => copiar(email, 'email')} copiado={copiado === 'email'} destacar />
      <Fila
        label="Contraseña"
        valor={verPass ? password : '•'.repeat(Math.max(password.length, 8))}
        onCopy={() => copiar(password, 'pass')}
        copiado={copiado === 'pass'}
        extra={
          <button onClick={() => setVerPass((v) => !v)} className="text-xs transition-colors hover:text-[var(--text-primary)]" style={{ color: 'var(--text-muted)' }}>
            {verPass ? 'Ocultar' : 'Mostrar'}
          </button>
        }
      />
    </div>
  );
}

function Fila({ label, valor, onCopy, copiado, extra, destacar }: {
  label: string; valor: string; onCopy: () => void; copiado: boolean; extra?: React.ReactNode; destacar?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 flex items-center justify-between gap-3 border transition-colors"
      style={destacar
        ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)' }
        : { background: 'var(--surface-muted)', borderColor: 'var(--border)' }}
    >
      <div className="min-w-0">
        <p className="dv-eyebrow mb-0.5">{label}</p>
        <p className="text-sm font-medium font-mono truncate" style={{ color: destacar ? 'var(--accent-hover)' : 'var(--text-primary)' }}>{valor}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {extra}
        <button onClick={onCopy} className="text-xs font-medium transition-colors hover:underline" style={{ color: copiado ? 'var(--success)' : 'var(--accent-hover)' }}>
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
