'use server';

import { createClient } from '@/lib/supabase/server';
import { CheckoutPayload } from '@/types/storefront';

export async function processP2PCheckout(payload: CheckoutPayload) {
  const supabase = await createClient();

  if (!payload.items || payload.items.length === 0) {
    return { success: false, error: 'El carrito de compras está vacío.' };
  }

  // 1. Detección Anti-Fraude: Validar si la referencia bancaria ya fue utilizada en esta tienda
  if (payload.paymentReference && payload.paymentReference.trim() !== '') {
    const cleanRef = payload.paymentReference.trim();
    
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, created_at')
      .eq('organization_id', payload.organizationId)
      .eq('payment_reference', cleanRef)
      .maybeSingle();

    if (existingOrder) {
      return {
        success: false,
        error: 'Esta referencia de pago ya ha sido registrada previamente en el sistema.',
      };
    }
  }

  // 2. Calcular total de la orden
  const totalAmountCents = payload.items.reduce(
    (acc, item) => acc + item.unitPriceCents * item.quantity,
    0
  );

  // 3. Crear el registro principal de la Orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      organization_id: payload.organizationId,
      customer_name: payload.customerName.trim(),
      customer_phone: payload.customerPhone.trim(),
      customer_instagram: payload.customerInstagram?.replace('@', '').trim() || null,
      total_amount_cents: totalAmountCents,
      currency: payload.currency,
      payment_method: payload.paymentMethod,
      payment_reference: payload.paymentReference?.trim() || null,
      status: 'pending_verification',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Error al registrar la orden. Intente nuevamente.' };
  }

  // 4. Insertar los items de la orden
  const orderItemsData = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price_cents: item.unitPriceCents,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData);

  if (itemsError) {
    // Revertir orden si fallan los items
    await supabase.from('orders').delete().eq('id', order.id);
    return { success: false, error: 'Error al procesar los productos de la orden.' };
  }

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
  };
}