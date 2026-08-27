'use client';

import { useState } from 'react';
import { StoreOrganization, Product, CartItem, Currency, PaymentMethod } from '@/types/storefront';
import { processP2PCheckout } from '../actions';
import { ShoppingBag, X, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  organization: StoreOrganization;
  products: Product[];
}

export default function StorefrontClient({ organization, products }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerInstagram, setCustomerInstagram] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');

  // Conversión de precios
  const formatPrice = (cents: number, cur: Currency) => {
    const usd = cents / 100;
    if (cur === 'USD' || cur === 'USDT') {
      return `$${usd.toFixed(2)} ${cur}`;
    }
    const ves = usd * (organization.currency_rate_usd_ves || 1);
    return `Bs. ${ves.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalCents = cart.reduce((acc, item) => acc + item.product.price_usd_cents * item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Botón de escape: WhatsApp Prellenado
  const getWhatsAppLink = () => {
    const itemsList = cart.map((i) => `• ${i.quantity}x ${i.product.title}`).join('%0A');
    const totalFormatted = formatPrice(totalCents, currency);
    const message = `Hola *${organization.name}*, quiero confirmar mi pedido:%0A%0A${itemsList}%0A%0A*Total:* ${totalFormatted}%0A*Nombre:* ${customerName || 'Cliente'}`;
    return `https://wa.me/?text=${message}`;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingOut(true);
    setStatusMessage(null);

    const res = await processP2PCheckout({
      organizationId: organization.id,
      customerName,
      customerPhone,
      customerInstagram,
      paymentMethod,
      paymentReference,
      currency,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitPriceCents: item.product.price_usd_cents,
      })),
    });

    setIsCheckingOut(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `¡Orden #${res.orderNumber} registrada! Verificaremos tu pago a la brevedad.`,
      });
      setCart([]);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Error al procesar la orden.' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-24 selection:bg-neutral-800">
      {/* Barra Superior */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-neutral-950/80 border-b border-neutral-800 px-4 py-3 max-w-lg mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">{organization.name}</h1>
          <p className="text-xs text-neutral-400">Tasa: Bs. {organization.currency_rate_usd_ves.toFixed(2)}/USD</p>
        </div>

        {/* Selector de Moneda */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
          {(['USD', 'VES', 'USDT'] as Currency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                currency === cur ? 'bg-neutral-100 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cur}
            </button>
          ))}
        </div>
      </header>

      {/* Grid del Catálogo */}
      <main className="max-w-lg mx-auto p-4 space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-sm">
            Esta tienda aún no tiene productos activos en catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-neutral-900/50 border border-neutral-800/80 rounded-xl overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition"
              >
                <div className="aspect-square bg-neutral-800 flex items-center justify-center text-neutral-600 text-xs relative">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <span>Sin foto</span>
                  )}
                  {product.stock <= 0 && (
                    <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      Agotado
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-neutral-200 line-clamp-1">{product.title}</h3>
                    <p className="text-sm font-bold text-white mt-1">
                      {formatPrice(product.price_usd_cents, currency)}
                    </p>
                  </div>

                  <button
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product)}
                    className="w-full mt-3 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 font-semibold text-xs rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Cart Trigger */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-0 right-0 max-w-lg mx-auto px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 px-4 rounded-xl shadow-2xl flex items-center justify-between transition"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>Ver Carrito ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </div>
            <span>{formatPrice(totalCents, currency)}</span>
          </button>
        </div>
      )}

      {/* Drawer del Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-neutral-900 border-t border-neutral-800 w-full max-w-lg max-h-[90vh] rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Cabecera Modal */}
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-sm">Tu Pedido</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Scrolleable */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {statusMessage ? (
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-200'
                      : 'bg-red-950/50 border border-red-800 text-red-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{statusMessage.text}</p>
                    {statusMessage.type === 'success' && (
                      <button
                        onClick={() => {
                          setStatusMessage(null);
                          setIsCartOpen(false);
                        }}
                        className="mt-3 text-xs underline font-bold"
                      >
                        Cerrar y seguir viendo
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Lista de Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between bg-neutral-950/60 p-3 rounded-lg border border-neutral-800">
                        <div>
                          <p className="font-semibold text-neutral-200">{item.product.title}</p>
                          <p className="text-neutral-400 mt-0.5">{formatPrice(item.product.price_usd_cents, currency)}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-700 px-2 py-1 rounded-md">
                          <button onClick={() => updateQuantity(item.product.id, -1)} className="text-neutral-400 hover:text-white font-bold px-1">-</button>
                          <span className="font-bold text-neutral-200">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, 1)} className="text-neutral-400 hover:text-white font-bold px-1">+</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-sm pt-2 text-white">
                      <span>Total:</span>
                      <span>{formatPrice(totalCents, currency)}</span>
                    </div>
                  </div>

                  {/* Formulario de Checkout */}
                  <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-2 border-t border-neutral-800">
                    <h3 className="font-semibold text-neutral-300">Datos para la Entrega</h3>
                    
                    <input
                      required
                      type="text"
                      placeholder="Nombre y Apellido"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        type="tel"
                        placeholder="WhatsApp / Teléfono"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                      />
                      <input
                        type="text"
                        placeholder="@usuario de Instagram"
                        value={customerInstagram}
                        onChange={(e) => setCustomerInstagram(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                      />
                    </div>

                    <h3 className="font-semibold text-neutral-300 pt-2">Método de Pago Directo</h3>
                    
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['pago_movil', 'zelle', 'usdt'] as PaymentMethod[]).map((method) => (
                        <button
                          type="button"
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 px-1 text-center capitalize rounded-lg border font-medium transition ${
                            paymentMethod === method
                              ? 'bg-neutral-100 text-neutral-950 border-white'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          {method.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Número de referencia o comprobante"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                    />

                    {/* Botón Principal de Envío */}
                    <button
                      type="submit"
                      disabled={isCheckingOut || cart.length === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-lg transition disabled:opacity-50 mt-2"
                    >
                      {isCheckingOut ? 'Procesando orden...' : 'Confirmar y Reportar Pago'}
                    </button>

                    {/* Botón de Escape a WhatsApp */}
                    <a
                      href={getWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      Pedir y coordinar por WhatsApp
                    </a>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}