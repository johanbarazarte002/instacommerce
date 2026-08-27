'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface ConnectInstagramInput {
  organizationId: string;
  instagramBusinessId: string;
  pageId: string;
  accessToken: string;
}

// 1. Validar y Guardar Credenciales de Instagram
export async function saveInstagramCredentials(input: ConnectInstagramInput) {
  const { organizationId, instagramBusinessId, pageId, accessToken } = input;

  if (!instagramBusinessId.trim() || !pageId.trim() || !accessToken.trim()) {
    return { success: false, error: 'Todos los campos son obligatorios' };
  }

  const cleanIgId = instagramBusinessId.trim();
  const cleanPageId = pageId.trim();
  const cleanToken = accessToken.trim();

  try {
    // 1. Verificación en caliente contra Meta Graph API
    const metaUrl = `https://graph.facebook.com/v21.0/${cleanIgId}?fields=username,name,profile_picture_url&access_token=${cleanToken}`;
    const metaRes = await fetch(metaUrl, { cache: 'no-store' });

    if (!metaRes.ok) {
      const errorJson = await metaRes.json();
      const metaMsg = errorJson?.error?.message || 'Token o ID de Instagram inválido';
      return { success: false, error: `Error de Meta: ${metaMsg}` };
    }

    const igData = await metaRes.json();
    const username = igData.username || 'instagram_account';

    // 2. Guardar o Actualizar en la base de datos (Upsert)
    const { error: dbError } = await supabaseAdmin
      .from('instagram_accounts')
      .upsert(
        {
          organization_id: organizationId,
          instagram_business_id: cleanIgId,
          page_id: cleanPageId,
          username: username,
          access_token: cleanToken,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'instagram_business_id' }
      );

    if (dbError) throw dbError;

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true, username };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Fallo al vincular cuenta';
    return { success: false, error: msg };
  }
}

// 2. Desvincular Cuenta
export async function disconnectInstagramAccount(organizationId: string) {
  const { error } = await supabaseAdmin
    .from('instagram_accounts')
    .delete()
    .eq('organization_id', organizationId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard');
  return { success: true };
}