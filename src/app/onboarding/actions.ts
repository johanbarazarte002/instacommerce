'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerAuthClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function createOrganizationOnboarding(formData: FormData) {
  const authSupabase = await createServerAuthClient();
  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  const brandName = (formData.get('brandName') as string)?.trim();
  const customSlug = (formData.get('slug') as string)?.trim();

  if (!brandName) {
    return { success: false, error: 'El nombre de la marca es obligatorio' };
  }

  const finalSlug = customSlug ? generateSlug(customSlug) : generateSlug(brandName);

  // 1. Validar que el slug no esté tomado por otra tienda
  const { data: existingOrg } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', finalSlug)
    .maybeSingle();

  if (existingOrg) {
    return { success: false, error: 'Este slug ya está en uso. Prueba con otro nombre.' };
  }

  // 2. Crear la Organización
  const { data: newOrg, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: brandName,
      slug: finalSlug,
      plan_tier: 'starter',
      currency_rate_usd_ves: 36.50,
      rate_mode: 'bcv',
    })
    .select('id, slug')
    .single();

  if (orgError || !newOrg) {
    return { success: false, error: 'Error al crear la tienda. Intenta nuevamente.' };
  }

  // 3. Vincular al usuario como 'owner' en organization_members
  const { error: memberError } = await supabaseAdmin
    .from('organization_members')
    .insert({
      organization_id: newOrg.id,
      user_id: user.id,
      role: 'owner',
    });

  if (memberError) {
    await supabaseAdmin.from('organizations').delete().eq('id', newOrg.id);
    return { success: false, error: 'Error al vincular membresía' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}