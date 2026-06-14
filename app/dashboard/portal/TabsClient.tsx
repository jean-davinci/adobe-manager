'use client';

import { useState } from 'react';

export default function TabsClient({
  tabs,
}: {
  tabs: Array<{ label: string; content: React.ReactNode }>;
}) {
  const [activo, setActivo] = useState(0);

  return (
    <div>
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setActivo(i)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activo === i ? 'var(--surface)' : 'transparent',
              color: activo === i ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: activo === i ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs[activo]?.content}
    </div>
  );
}
