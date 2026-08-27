'use client';

import { useState } from 'react';
import { updateOrderStatus } from '../actions';
import { CheckCircle2, XCircle, Clock, AlertTriangle, MessageCircle, Camera } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_cents: number;
  product?: { title: string } | null;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_instagram: string | null;
  total_amount_cents: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  status: 'pending_verification' | 'paid' | 'cancelled' | 'refunded';
  created_at: string;
  order_items: OrderItem[];
  isDuplicateRef?: boolean;
}

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    setUpdatingId(orderId);
    await updateOrderStatus(orderId, status);
    setUpdatingId(null);
  };

  const filteredOrders = initialOrders.filter((order) => {
    if (filter === 'pending') return order.status === 'pending_verification';
    if (filter === 'paid') return order.status === 'paid';
    return true;
  });

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      {/* Header & Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <h3 className="font-semibold text-sm text-neutral-200">Conciliación de Pagos & Órdenes</h3>
          <p className="text-xs text-neutral-400">Verifica comprobantes y aprueba despachos</p>
        </div>

        <div className="flex bg-neutral-950 border border-neutral-800 p-1 rounded-xl text-xs">
          {(['all', 'pending', 'paid'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                filter === tab ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab === 'all' ? 'Todas' : tab === 'pending' ? 'Por Verificar' : 'Aprobadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Órdenes */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-neutral-500 text-xs">
          No hay órdenes registradas con este filtro.
        </div>
      ) : (
        <div className="divide-y divide-neutral-800/60">
          {filteredOrders.map((order) => {
            const total = (order.total_amount_cents / 100).toFixed(2);
            return (
              <div key={order.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info Cliente & Productos */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-300">#{order.order_number}</span>
                    <span className="font-semibold text-sm text-white">{order.customer_name}</span>
                    
                    {/* Alerta Anti-Fraude */}
                    {order.isDuplicateRef && (
                      <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Ref. Duplicada
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <a
                      href={`https://wa.me/${order.customer_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-400 flex items-center gap-1 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      {order.customer_phone}
                    </a>
                    {order.customer_instagram && (
                      <a
                        href={`https://instagram.com/${order.customer_instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-pink-400 flex items-center gap-1 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        @{order.customer_instagram}
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-neutral-400 pt-1">
                    <span className="capitalize font-medium text-neutral-300">{order.payment_method.replace('_', ' ')}</span>
                    {order.payment_reference && (
                      <span className="ml-2 font-mono text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        Ref: {order.payment_reference}
                      </span>
                    )}
                  </div>
                </div>

                {/* Monto & Acciones de Validación */}
                <div className="flex items-center justify-between md:justify-end gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${total} <span className="text-xs text-neutral-400 font-normal">{order.currency}</span></p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 ${
                        order.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : order.status === 'pending_verification'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {order.status === 'paid' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Botones de Acción */}
                  <div className="flex items-center gap-1.5">
                    {order.status === 'pending_verification' && (
                      <>
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'paid')}
                          className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-neutral-950 p-2 rounded-xl border border-emerald-500/20 transition cursor-pointer"
                          title="Aprobar Pago"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          disabled={updatingId === order.id}
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded-xl border border-red-500/20 transition cursor-pointer"
                          title="Rechazar / Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}