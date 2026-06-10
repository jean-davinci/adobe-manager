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
        <label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-1.5">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {state?.fields?.email && (
          <p className="text-xs text-red-500 mt-1">{state.fields.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-medium text-gray-500 mb-1.5">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {state?.fields?.password && (
          <p className="text-xs text-red-500 mt-1">{state.fields.password}</p>
        )}
      </div>

      {state?.error && (
        <div className="p-2.5 rounded-lg bg-red-50 text-xs text-red-600 text-center">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700 disabled:bg-gray-300 transition-colors font-medium"
      >
        {pending ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
