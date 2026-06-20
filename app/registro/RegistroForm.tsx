'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroForm() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '', confirmar: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((v) => ({ ...v, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirmar) {
      setFieldErrors({ confirmar: 'Las contraseñas no coinciden.' });
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: 'Mínimo 8 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.nombre, email: form.email, telefono: form.telefono, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al registrar.');
        if (data.fields) setFieldErrors(data.fields);
        return;
      }
      router.push('/portal');
    } finally {
      setLoading(false);
    }
  };

  const field = (
    id: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = '',
    extra?: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <div>
      <label htmlFor={id} className="dv-label">{label}</label>
      <input
        id={id}
        type={type}
        value={form[id]}
        onChange={set(id)}
        placeholder={placeholder}
        className="dv-input"
        {...extra}
      />
      {fieldErrors[id] && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{fieldErrors[id]}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {field('nombre', 'Nombre completo', 'text', 'Juan Pérez', { required: true, autoComplete: 'name' })}
      {field('email', 'Correo electrónico', 'email', 'tu@email.com', { required: true, autoComplete: 'email' })}
      {field('telefono', 'WhatsApp (opcional)', 'tel', '+51 9XX XXX XXX', { autoComplete: 'tel' })}
      {field('password', 'Contraseña', 'password', '••••••••', { required: true, autoComplete: 'new-password' })}
      {field('confirmar', 'Confirmar contraseña', 'password', '••••••••', { required: true, autoComplete: 'new-password' })}

      {error && (
        <div className="p-3 rounded-xl text-xs text-center" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 hover:shadow-[0_4px_14px_rgba(26,43,74,0.3)]"
        style={{ background: 'var(--brand)' }}
      >
        {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
      </button>

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="font-medium underline" style={{ color: 'var(--brand)' }}>
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
