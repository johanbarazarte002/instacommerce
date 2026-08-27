import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface UserSessionOrg {
  user: {
    id: string;
    email: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    currency_rate_usd_ves: number;
    rate_mode: 'bcv' | 'custom';
    bcv_last_synced?: string;
  };
  role: 'owner' | 'admin' | 'member' | 'client_reviewer';
}

export async function getActiveUserOrganization(): Promise<UserSessionOrg> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener la membresía del usuario y la organización asociada
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(*)')
    .eq('user_id', user.id)
    .maybeSingle();

  // Si el usuario está registrado pero aún no tiene una tienda, mandarlo al onboarding
  if (!member || !member.organizations) {
    redirect('/onboarding');
  }

  const org = Array.isArray(member.organizations)
    ? member.organizations[0]
    : member.organizations;

  return {
    user: { id: user.id, email: user.email ?? null },
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      currency_rate_usd_ves: Number(org.currency_rate_usd_ves) || 1,
      rate_mode: (org.rate_mode as 'bcv' | 'custom') || 'bcv',
      bcv_last_synced: org.bcv_last_synced,
    },
    role: member.role,
  };
}