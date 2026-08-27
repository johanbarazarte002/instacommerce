'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface ProductInput {
  organizationId: string;
  title: string;
  description?: string;
  priceUsd: number;
  stock: number;
  images: string[];
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Crear Producto
export async function createProduct(input: ProductInput) {
  if (!input.title.trim() || input.priceUsd < 0) {
    return { success: false, error: 'Título y precio válido son obligatorios' };
  }

  const baseSlug = generateSlug(input.title);
  const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
  const priceCents = Math.round(input.priceUsd * 100);

  const { error } = await supabaseAdmin.from('products').insert({
    organization_id: input.organizationId,
    title: input.title.trim(),
    slug: uniqueSlug,
    description: input.description?.trim() || null,
    price_usd_cents: priceCents,
    stock: input.stock,
    images: input.images,
    is_active: true,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/products');
  revalidatePath('/[storeSlug]', 'page');
  return { success: true };
}

// 2. Alternar Estado Activo / Pausado
export async function toggleProductStatus(productId: string, currentStatus: boolean) {
  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/products');
  revalidatePath('/[storeSlug]', 'page');
  return { success: true };
}

// 3. Eliminar Producto
export async function deleteProduct(productId: string) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/products');
  revalidatePath('/[storeSlug]', 'page');
  return { success: true };
}