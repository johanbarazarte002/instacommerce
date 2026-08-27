import { createClient } from '@supabase/supabase-js';
import { getActiveUserOrganization } from '@/lib/auth/session';
import ProductsList from './components/ProductsList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Product } from '@/types/storefront';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function ProductsDashboardPage() {
  const { organization: org } = await getActiveUserOrganization();

  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false });

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
              <h1 className="font-bold text-sm text-white">Catálogo de {org.name}</h1>
              <p className="text-xs text-neutral-400 font-mono">/{org.slug}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <ProductsList organizationId={org.id} initialProducts={(products as Product[]) ?? []} />
      </main>
    </div>
  );
}