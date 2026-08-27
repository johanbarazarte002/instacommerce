'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Cliente administrativo con Service Role para ejecutar acciones del servidor de forma segura
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// 1. Sincronizar automáticamente con la Tasa Oficial del BCV
export async function syncBcvRate(organizationId: string) {
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Error al consultar la API del BCV');

    const data = await res.json();
    const bcvRate = parseFloat(data.promedio);

    if (!bcvRate || isNaN(bcvRate)) throw new Error('Tasa BCV inválida');

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({
        currency_rate_usd_ves: bcvRate,
        rate_mode: 'bcv',
        bcv_last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) throw error;

    revalidatePath('/dashboard');
    revalidatePath('/[storeSlug]', 'page');
    return { success: true, rate: bcvRate };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return { success: false, error: msg };
  }
}

// 2. Establecer una Tasa Personalizada/Manual
export async function setCustomCurrencyRate(organizationId: string, customRate: number) {
  if (customRate <= 0) {
    return { success: false, error: 'La tasa debe ser mayor a 0' };
  }

  const { error } = await supabaseAdmin
    .from('organizations')
    .update({
      currency_rate_usd_ves: customRate,
      rate_mode: 'custom',
      updated_at: new Date().toISOString(),
    })
    .eq('id', organizationId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/[storeSlug]', 'page');
  return { success: true };
}

// 3. Cambiar estado de una orden
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'pending_verification' | 'paid' | 'cancelled' | 'refunded'
) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

// 4. Reglas de Auto-DM
export async function createAutomationRule(
  organizationId: string,
  triggerKeyword: string,
  replyMessage: string
) {
  if (!triggerKeyword.trim() || !replyMessage.trim()) {
    return { success: false, error: 'Campos obligatorios' };
  }

  const { error } = await supabaseAdmin.from('automation_rules').insert({
    organization_id: organizationId,
    trigger_keyword: triggerKeyword.trim().toUpperCase(),
    reply_message: replyMessage.trim(),
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}

export async function toggleAutomationRule(ruleId: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('automation_rules')
    .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
    .eq('id', ruleId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  return { success: true };
}