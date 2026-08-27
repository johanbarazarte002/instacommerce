'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export interface ScheduledPostInput {
  organizationId: string;
  caption?: string;
  mediaUrls: string[];
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  scheduledFor?: string | null;
}

// 1. Crear nuevo borrador
export async function createScheduledPost(input: ScheduledPostInput) {
  if (!input.mediaUrls || input.mediaUrls.length === 0) {
    return { success: false, error: 'Debe incluir al menos una imagen' };
  }

  const { data: latestPost } = await supabaseAdmin
    .from('scheduled_posts')
    .select('grid_position')
    .eq('organization_id', input.organizationId)
    .order('grid_position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextPosition = (latestPost?.grid_position ?? -1) + 1;

  const { data: newPost, error } = await supabaseAdmin
    .from('scheduled_posts')
    .insert({
      organization_id: input.organizationId,
      caption: input.caption?.trim() || null,
      media_urls: input.mediaUrls,
      media_type: input.mediaType || 'IMAGE',
      grid_position: nextPosition,
      status: input.scheduledFor ? 'scheduled' : 'draft',
      scheduled_for: input.scheduledFor || null,
    })
    .select('*')
    .single();

  if (error || !newPost) return { success: false, error: error?.message || 'Error al guardar' };

  revalidatePath('/dashboard/planner');
  return { success: true, post: newPost };
}

// 2. Reordenar posiciones del Grid en lote
export async function updateGridPositions(
  organizationId: string,
  orderedPosts: { id: string; grid_position: number }[]
) {
  try {
    const updatePromises = orderedPosts.map((post) =>
      supabaseAdmin
        .from('scheduled_posts')
        .update({ grid_position: post.grid_position, updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .eq('organization_id', organizationId)
    );

    await Promise.all(updatePromises);
    revalidatePath('/dashboard/planner');
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error al reordenar';
    return { success: false, error: msg };
  }
}

// 3. Eliminar post
export async function deleteScheduledPost(postId: string) {
  const { error } = await supabaseAdmin
    .from('scheduled_posts')
    .delete()
    .eq('id', postId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/planner');
  return { success: true };
}