import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

interface MetaWebhookEntry {
  id: string; // instagram_business_id
  changes?: {
    field: string;
    value: {
      id: string; // comment_id
      text: string; // comment text
      from: { id: string; username: string };
      media: { id: string };
    };
  }[];
}

export async function processWebhookQueueItem(queueId: string, payload: unknown) {
  const entry = payload as MetaWebhookEntry;
  
  try {
    const igBusinessId = entry.id;
    const changes = entry.changes ?? [];

    for (const change of changes) {
      if (change.field !== 'comments') continue;

      const commentText = change.value.text?.toUpperCase() || '';
      const commenterId = change.value.from?.id;
      const commentId = change.value.id;

      if (!commenterId || !commentText) continue;

      // 1. Obtener la cuenta de Instagram y su organización
      const { data: account } = await supabaseAdmin
        .from('instagram_accounts')
        .select('organization_id, access_token, organizations(slug, name)')
        .eq('instagram_business_id', igBusinessId)
        .eq('is_active', true)
        .single();

      if (!account) continue;

      const org = Array.isArray(account.organizations) 
        ? account.organizations[0] 
        : account.organizations;

      if (!org) continue;

      // 2. Buscar si el comentario contiene alguna palabra clave activa
      const { data: rules } = await supabaseAdmin
        .from('automation_rules')
        .select('*')
        .eq('organization_id', account.organization_id)
        .eq('is_active', true);

      if (!rules || rules.length === 0) continue;

      const matchedRule = rules.find((r) =>
        commentText.includes(r.trigger_keyword.toUpperCase())
      );

      if (matchedRule) {
        // Construir la URL personalizada del Storefront
        const storeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${org.slug}`;
        const finalMessage = matchedRule.reply_message.replace(/{{store_url}}/g, storeUrl);

        // 3. Enviar Mensaje Privado vía Meta Graph API
        await sendMetaPrivateReply(commentId, finalMessage, account.access_token);
      }
    }

    // Marcar como procesado con éxito
    await supabaseAdmin
      .from('webhook_events_queue')
      .update({ status: 'processed', processed_at: new Date().toISOString() })
      .eq('id', queueId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabaseAdmin
      .from('webhook_events_queue')
      .update({ status: 'failed', error_log: errorMessage })
      .eq('id', queueId);
  }
}

async function sendMetaPrivateReply(commentId: string, message: string, accessToken: string) {
  const url = `https://graph.facebook.com/v21.0/${commentId}/replies`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      access_token: accessToken,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(`Meta Graph API Error: ${JSON.stringify(errorData)}`);
  }
}