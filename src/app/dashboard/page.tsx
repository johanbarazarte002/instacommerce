import { createClient } from '@supabase/supabase-js';
import { getActiveUserOrganization } from '@/lib/auth/session';
import { logoutAction } from '@/app/auth/actions';
import ExchangeRateCard from './components/ExchangeRateCard';
import OrdersTable, { Order } from './components/OrdersTable';
import AutomationRulesCard, { Rule } from './components/AutomationRulesCard';
import Link from 'next/link';
import { Store, ExternalLink, LogOut, LayoutGrid, Package, Wand2, Settings } from 'lucide-react';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function DashboardPage() {
  // 1. Obtener la Organización REAL del usuario autenticado
  const { organization: org, user } = await getActiveUserOrganization();

  // 2. Cargar en paralelo sus órdenes y reglas
  const [ordersRes, rulesRes] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('*, order_items(*, product:products(title))')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('automation_rules')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false }),
  ]);

  const rawOrders = (ordersRes.data ?? []) as Order[];
  const rules = (rulesRes.data ?? []) as Rule[];

  // Algoritmo Anti-Fraude
  const referenceCounts = rawOrders.reduce((acc, order) => {
    if (order.payment_reference) {
      const ref = order.payment_reference.trim();
      acc[ref] = (acc[ref] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const orders: Order[] = rawOrders.map((order) => ({
    ...order,
    isDuplicateRef: Boolean(
      order.payment_reference && referenceCounts[order.payment_reference.trim()] > 1
    ),
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      {/* Header Dashboard */}
      <header className="border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-neutral-950 text-sm">
              OS
            </div>
            <div>
              <h1 className="font-bold text-sm text-white">{org.name}</h1>
              <p className="text-[11px] text-neutral-400 font-mono">/{org.slug}</p>
            </div>
          </div>

          {/* Menú de Navegación Rápida */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl transition"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Inventario</span>
            </Link>

            <Link
              href="/dashboard/planner"
              className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl transition"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Feed 3x3</span>
            </Link>

            <Link
              href="/dashboard/ai"
              className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl transition"
            >
              <Wand2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">IA Assistant</span>
            </Link>

            <Link
              href={`/${org.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl transition font-medium"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Tienda</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
                href="/dashboard/settings"
                className="flex items-center gap-1.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl transition"
>
                <Settings className="w-3.5 h-3.5 text-neutral-400" />
               <span className="hidden sm:inline">Ajustes</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-xl transition cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExchangeRateCard
            organizationId={org.id}
            initialRate={org.currency_rate_usd_ves}
            initialMode={org.rate_mode}
            lastSynced={org.bcv_last_synced}
          />
          <AutomationRulesCard organizationId={org.id} rules={rules} />
        </div>

        <OrdersTable initialOrders={orders} />
      </main>
    </div>
  );
}