import { requireRole } from '@/lib/dal';
import { statsPortal, listarTodosPedidos, listarComprasPendientes, listarClientesPortal } from '@/lib/portal';
import ModuleHeader from '@/app/components/ModuleHeader';
import PedidosAdmin from './PedidosAdmin';
import ComprasAdmin from './ComprasAdmin';
import ClientesAdmin from './ClientesAdmin';
import TabsClient from './TabsClient';

export const metadata = { title: 'Portal Clientes — Davinci Labs' };

export default async function PortalAdminPage() {
  await requireRole('ADMIN', 'OPERATOR');

  const [stats, pedidos, compras, clientes] = await Promise.all([
    statsPortal(),
    listarTodosPedidos(),
    listarComprasPendientes(),
    listarClientesPortal(),
  ]);

  const pagosPendientes = compras.filter((c) => c.estado === 'pendiente').length;

  return (
    <div>
      <ModuleHeader
        eyebrow="Portal"
        titulo="Portal Clientes"
        descripcion="Gestión de clientes, pedidos Turnitin y pagos de créditos"
      />

      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Clientes',           value: stats.clientes,          icon: '👥', color: 'var(--brand)'   },
            { label: 'Pedidos pendientes', value: stats.pedidosPendientes, icon: '⏳', color: 'var(--warning)' },
            { label: 'Pagos pendientes',   value: stats.comprasPendientes, icon: '💳', color: 'var(--danger)'  },
            { label: 'Pedidos hoy',        value: stats.pedidosHoy,        icon: '📄', color: 'var(--success)' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Alerta pagos pendientes */}
        {pagosPendientes > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{ background: 'var(--warning-soft)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <span>⚠️</span>
            <p className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
              {pagosPendientes} pago{pagosPendientes !== 1 ? 's' : ''} pendiente{pagosPendientes !== 1 ? 's' : ''} de confirmación
            </p>
          </div>
        )}

        {/* Tabs: Pedidos / Compras / Clientes */}
        <TabsClient
          tabs={[
            {
              label: `Pedidos (${pedidos.length})`,
              content: <PedidosAdmin pedidosIniciales={pedidos as any} />,
            },
            {
              label: `Pagos${pagosPendientes > 0 ? ` ⚠️${pagosPendientes}` : ` (${compras.length})`}`,
              content: <ComprasAdmin comprasIniciales={compras as any} />,
            },
            {
              label: `Clientes (${clientes.length})`,
              content: <ClientesAdmin clientesIniciales={clientes as any} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
