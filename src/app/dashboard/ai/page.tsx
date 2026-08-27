import { getActiveUserOrganization } from '@/lib/auth/session';
import AiAssistantClient from './components/AiAssistantClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AiAssistantPage() {
  const { organization: org } = await getActiveUserOrganization();

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
              <h1 className="font-bold text-sm text-white">Asistente IA de {org.name}</h1>
              <p className="text-xs text-neutral-400 font-mono">DeepSeek-V3 Engine</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AiAssistantClient storeSlug={org.slug} />
      </main>
    </div>
  );
}