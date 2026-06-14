'use client';

// Renderizador ligero de markdown para los mensajes del agente Davinci.
// Soporta: **bold**, *italic*, `code`, ## cabeceras, - listas, líneas vacías.
// Sin dependencia externa.

type Props = { texto: string; className?: string };

function parsearLinea(linea: string, key: number) {
  // Procesar inline: **bold**, *italic*, `code`
  const partes: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(linea)) !== null) {
    if (m.index > ultimo) partes.push(linea.slice(ultimo, m.index));
    if (m[2]) partes.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) partes.push(<em key={m.index}>{m[3]}</em>);
    else if (m[4]) partes.push(<code key={m.index} className="px-1 py-0.5 rounded text-[11px]" style={{ background: 'var(--surface-muted)', fontFamily: 'monospace' }}>{m[4]}</code>);
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linea.length) partes.push(linea.slice(ultimo));
  return <span key={key}>{partes}</span>;
}

export default function MdTexto({ texto, className }: Props) {
  const lineas = texto.split('\n');
  const nodos: React.ReactNode[] = [];
  let iLista: React.ReactNode[] = [];

  const flushLista = () => {
    if (iLista.length) {
      nodos.push(
        <ul key={`ul-${nodos.length}`} className="pl-4 space-y-0.5 my-1" style={{ listStyleType: 'disc' }}>
          {iLista}
        </ul>
      );
      iLista = [];
    }
  };

  lineas.forEach((linea, i) => {
    // Cabeceras ## o ###
    const cabecera = linea.match(/^(#{1,3})\s+(.+)/);
    if (cabecera) {
      flushLista();
      const nivel = cabecera[1].length;
      const cls = nivel === 1 ? 'text-base font-bold mt-2' : nivel === 2 ? 'text-sm font-semibold mt-1.5' : 'text-xs font-semibold mt-1';
      nodos.push(<p key={i} className={cls}>{parsearLinea(cabecera[2], i)}</p>);
      return;
    }
    // Ítems de lista - o *
    const item = linea.match(/^[\-\*]\s+(.*)/);
    if (item) {
      iLista.push(<li key={i} className="text-sm leading-relaxed">{parsearLinea(item[1], i)}</li>);
      return;
    }
    // Ítems numerados
    const numItem = linea.match(/^\d+\.\s+(.*)/);
    if (numItem) {
      flushLista();
      nodos.push(<p key={i} className="text-sm leading-relaxed">{parsearLinea(numItem[1], i)}</p>);
      return;
    }
    // Línea vacía
    if (!linea.trim()) {
      flushLista();
      nodos.push(<div key={i} className="h-1" />);
      return;
    }
    // Línea normal
    flushLista();
    nodos.push(<p key={i} className="text-sm leading-relaxed">{parsearLinea(linea, i)}</p>);
  });

  flushLista();

  return <div className={className}>{nodos}</div>;
}
