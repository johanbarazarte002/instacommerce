import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getActiveUserOrganization } from '@/lib/auth/session';
import SettingsClient, { ConnectedAccount } from './components/SettingsClient';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function SettingsPage() {
  const { organization: org } = await getActiveUserOrganization();

  const { data: account } = await supabaseAdmin
    .from('instagram_accounts')
    .select('*')
    .eq('organization_id', org.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans pb-16">
      <header className="border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-bold text-sm text-white">Ajustes de {org.name}</h1>
              <p className="text-xs text-neutral-400 font-mono">/{org.slug}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12 text-neutral-500 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando ajustes...</span>
            </div>
          }
        >
          <SettingsClient
            organizationId={org.id}
            orgName={org.name}
            orgSlug={org.slug}
            connectedAccount={(account as ConnectedAccount) ?? null}
          />
        </Suspense>
      </main>
    </div>
  );
}