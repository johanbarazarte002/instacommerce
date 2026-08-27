export function getMetaOAuthUrl(stateOrgId: string): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || '';
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/meta/callback`;
  const scopes = [
    'instagram_basic',
    'instagram_manage_comments',
    'instagram_manage_messages',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts',
  ].join(',');

  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&state=${stateOrgId}&response_type=code`;
}