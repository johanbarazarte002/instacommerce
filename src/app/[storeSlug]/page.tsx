import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StorefrontClient from './components/StorefrontClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { storeSlug } = await params;
  const supabase = await createClient();

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('slug', storeSlug)
    .maybeSingle();

  if (!organization) return { title: 'Tienda No Encontrada' };

  return {
    title: `${organization.name} | Catálogo Oficial`,
    description: `Catálogo oficial de ${organization.name}.`,
  };
}

export default async function StorePage({ params }: Props) {
  const { storeSlug } = await params;
  const supabase = await createClient();

  // 1. Obtener Organización
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, currency_rate_usd_ves')
    .eq('slug', storeSlug)
    .maybeSingle();

  if (orgError || !org) {
    notFound();
  }

  // 2. Obtener Productos
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Forzar que la tasa sea un número flotante real
  const sanitizedOrg = {
    ...org,
    currency_rate_usd_ves: Number(org.currency_rate_usd_ves) || 1,
  };

  return <StorefrontClient organization={sanitizedOrg} products={products ?? []} />;
}