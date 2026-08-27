'use client';

import { useState } from 'react';
import { createOrganizationOnboarding } from './actions';
import { Loader2, Store, Sparkles, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const [brandName, setBrandName] = useState('');
  const [slug, setSlug] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBrandName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createOrganizationOnboarding(formData);

    if (res && !res.success) {
      setErrorMsg(res.error || 'Error al configurar tienda');
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Configura tu Marca</h1>
          <p className="text-xs text-neutral-400">Personaliza la URL de tu catálogo público para Instagram</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl space-y-4 shadow-xl text-xs backdrop-blur-sm">
          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Nombre de tu Marca o Tienda</label>
            <input
              name="brandName"
              type="text"
              required
              placeholder="Ej: Urban Style Caracas"
              value={brandName}
              onChange={handleBrandChange}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600 font-medium"
            />
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Tu Enlace de Compra (Link-in-Bio)</label>
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-400">
              <span className="text-neutral-500 select-none">instacommerce.os/</span>
              <input
                name="slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className="w-full bg-transparent text-white font-mono font-bold focus:outline-none ml-0.5"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">Este es el enlace que tus clientes recibirán por Auto-DM.</p>
          </div>

          <button
            type="submit"
            disabled={isPending || !brandName.trim()}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-emerald-950/40"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Lanzar mi Tienda</span>
            {!isPending && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
}