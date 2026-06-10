'use client';

import { logout } from '@/app/actions/auth';

export default function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={
          className ??
          'text-xs text-gray-500 hover:text-red-600 transition-colors'
        }
      >
        Cerrar sesión
      </button>
    </form>
  );
}
