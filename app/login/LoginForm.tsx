'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/app/actions/auth';

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="dv-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="dv-input"
        />
        {state?.fields?.email && (
          <p className="text-xs mt-1 dv-animate-in" style={{ color: 'var(--danger)' }}>{state.fields.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="dv-label">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="dv-input"
        />
        {state?.fields?.password && (
          <p className="text-xs mt-1 dv-animate-in" style={{ color: 'var(--danger)' }}>{state.fields.password}</p>
        )}
      </div>

      {state?.error && (
        <div className="p-2.5 rounded-lg text-xs text-center dv-animate-in"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 text-sm rounded-xl font-medium text-white transition-all disabled:opacity-50 hover:shadow-[0_4px_14px_rgba(26,43,74,0.3)]"
        style={{ background: 'var(--brand)' }}
      >
        {pending ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
