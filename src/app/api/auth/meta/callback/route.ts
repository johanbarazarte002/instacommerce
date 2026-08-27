import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const orgId = searchParams.get('state'); // Recibimos el organization_id de forma segura
  const error = searchParams.get('error_description');

  const redirectBase = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings`;

  if (error || !code || !orgId) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(error || 'Acceso denegado por el usuario')}`);
  }

  try {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/meta/callback`;

    // 1. Canjear 'code' por un User Access Token de corta duración
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&client_secret=${appSecret}&code=${code}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) throw new Error(tokenData.error?.message || 'Error canjeando token');
    const shortLivedToken = tokenData.access_token;

    // 2. Extender a Token de Larga Duración (Válido por 60 días)
    const longLivedUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    const longLivedToken = longLivedData.access_token || shortLivedToken;

    // 3. Consultar las Páginas de Facebook y sus cuentas de Instagram vinculadas
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longLivedToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    const pages = accountsData.data ?? [];
    // Buscar la primera página que tenga cuenta de Instagram empresarial vinculada
    const pageWithIg = pages.find((p: { instagram_business_account?: { id: string; username: string } }) => p.instagram_business_account?.id);

    if (!pageWithIg || !pageWithIg.instagram_business_account) {
      return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent('Tu página de Facebook no tiene una cuenta de Instagram Profesional/Empresarial vinculada.')}`
      );
    }

    const pageId = pageWithIg.id;
    const pageAccessToken = pageWithIg.access_token || longLivedToken;
    const igId = pageWithIg.instagram_business_account.id;
    const igUsername = pageWithIg.instagram_business_account.username;

    // 4. Guardar automáticamente en la base de datos
    const { error: dbError } = await supabaseAdmin.from('instagram_accounts').upsert(
      {
        organization_id: orgId,
        instagram_business_id: igId,
        page_id: pageId,
        username: igUsername,
        access_token: pageAccessToken,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'instagram_business_id' }
    );

    if (dbError) throw dbError;

    return NextResponse.redirect(`${redirectBase}?success=connected&user=${encodeURIComponent(igUsername)}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al conectar';
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(msg)}`);
  }
}