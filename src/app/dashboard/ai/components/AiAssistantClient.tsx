'use client';

import { useState } from 'react';
import { generateInstagramPost, auditInstagramBio } from '../actions';
import { Sparkles, Copy, Check, Video, Search, UserCheck, Loader2 } from 'lucide-react';

interface PostResult {
  hooks: string[];
  caption: string;
  seoKeywords: string[];
}

interface BioResult {
  score: number;
  diagnosis: string;
  optimizedBio: string;
  storyHighlightsIdeas: string[];
}

export default function AiAssistantClient({ storeSlug }: { storeSlug: string }) {
  const [activeTab, setActiveTab] = useState<'post' | 'bio'>('post');

  // Form Post State
  const [productName, setProductName] = useState('');
  const [niche, setNiche] = useState('Moda & Ropa');
  const [targetCity, setTargetCity] = useState('Caracas');
  const [keyBenefit, setKeyBenefit] = useState('');
  const [triggerKeyword, setTriggerKeyword] = useState('PRECIO');

  // Form Bio State
  const [currentBio, setCurrentBio] = useState('');
  const [bioCity, setBioCity] = useState('Caracas');

  // Outputs
  const [isLoading, setIsLoading] = useState(false);
  const [postResult, setPostResult] = useState<PostResult | null>(null);
  const [bioResult, setBioResult] = useState<BioResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGeneratePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await generateInstagramPost({
      productName,
      niche,
      targetCity,
      keyBenefit,
      triggerKeyword,
    });

    setIsLoading(false);
    if (res.success && res.data) {
      setPostResult(res.data);
    } else {
      setErrorMsg(res.error || 'Error al generar post');
    }
  };

  const handleAuditBio = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const res = await auditInstagramBio({
      currentBio,
      niche,
      city: bioCity,
      storeSlug,
    });

    setIsLoading(false);
    if (res.success && res.data) {
      setBioResult(res.data);
    } else {
      setErrorMsg(res.error || 'Error al auditar bio');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Asistente de IA Semántica & SEO</span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
              DeepSeek Engine
            </span>
          </h2>
          <p className="text-xs text-neutral-400">Genera ganchos de retención y optimiza palabras clave para la búsqueda de Instagram</p>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-2xl max-w-md text-xs">
        <button
          onClick={() => setActiveTab('post')}
          className={`flex-1 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'post' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-pink-400" />
          <span>Generador de Post & Hooks</span>
        </button>

        <button
          onClick={() => setActiveTab('bio')}
          className={`flex-1 py-2 rounded-xl font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'bio' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Auditor de Biografía</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs">
          {errorMsg}
        </div>
      )}

      {/* TAB 1: Generador de Post */}
      {activeTab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario */}
          <form onSubmit={handleGeneratePost} className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Parámetros de Conversión</h3>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Producto o Servicio</label>
              <input
                required
                placeholder="Ej: Franelas Oversize Heavyweight 240gsm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Nicho</label>
                <input
                  required
                  placeholder="Ej: Ropa Streetwear"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Ciudad Objetivo</label>
                <input
                  required
                  placeholder="Ej: Caracas, Valencia"
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Diferenciador / Beneficio Principal</label>
              <input
                required
                placeholder="Ej: No se encoge con lavadas + Delivery gratis"
                value={keyBenefit}
                onChange={(e) => setKeyBenefit(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Palabra Clave para Auto-DM</label>
              <input
                required
                placeholder="Ej: PRECIO"
                value={triggerKeyword}
                onChange={(e) => setTriggerKeyword(e.target.value.toUpperCase())}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-none focus:border-neutral-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-neutral-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Generar con DeepSeek (Gratis)</span>
            </button>
          </form>

          {/* Resultados */}
          <div className="lg:col-span-7 space-y-4">
            {!postResult ? (
              <div className="h-full min-h-[300px] border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-xs text-neutral-500">
                <Sparkles className="w-8 h-8 text-neutral-700 mb-2" />
                <span>Completa los datos para generar hooks de Reels, copy persuasivo y palabras clave para SEO.</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* 1. Hooks Visuales */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-pink-400 flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      <span>Hooks Visuales (Primeros 3 segundos del Reel)</span>
                    </h4>
                  </div>
                  <div className="space-y-1.5">
                    {postResult.hooks.map((hook, idx) => (
                      <div key={idx} className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-2">
                        <span className="text-neutral-200">{hook}</span>
                        <button
                          onClick={() => copyToClipboard(hook, `hook_${idx}`)}
                          className="text-neutral-400 hover:text-white p-1"
                        >
                          {copiedKey === `hook_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Caption Estructurado */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">Descripción / Caption de Conversión</h4>
                    <button
                      onClick={() => copyToClipboard(postResult.caption, 'caption')}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium text-[11px]"
                    >
                      {copiedKey === 'caption' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copiar Caption</span>
                    </button>
                  </div>
                  <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 whitespace-pre-wrap text-neutral-300 leading-relaxed font-sans">
                    {postResult.caption}
                  </div>
                </div>

                {/* 3. SEO Keywords */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>Palabras Clave de Búsqueda para Instagram (Search Intent)</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {postResult.seoKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                      >
                        #{kw.replace(/\s+/g, '')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Auditor de Bio */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAuditBio} className="lg:col-span-5 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Auditar Perfil de Instagram</h3>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Biografía Actual (o idea borrador)</label>
              <textarea
                rows={3}
                placeholder="Pega aquí lo que tienes actualmente en tu perfil..."
                value={currentBio}
                onChange={(e) => setCurrentBio(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Nicho</label>
                <input
                  required
                  placeholder="Ej: Calzado Deportivo"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Ciudad Base</label>
                <input
                  required
                  placeholder="Ej: Maracaibo"
                  value={bioCity}
                  onChange={(e) => setBioCity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Auditar con DeepSeek</span>
            </button>
          </form>

          {/* Resultado Auditoría */}
          <div className="lg:col-span-7">
            {!bioResult ? (
              <div className="h-full min-h-[300px] border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-xs text-neutral-500">
                <UserCheck className="w-8 h-8 text-neutral-700 mb-2" />
                <span>Audita la biografía para recibir una puntuación y la reescritura optimizada hacia tu Storefront.</span>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Score Card */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">Puntuación de Conversión</span>
                    <p className="text-xs text-neutral-300 mt-1">{bioResult.diagnosis}</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-lg font-black text-emerald-400">
                    {bioResult.score}%
                  </div>
                </div>

                {/* Bio Optimizada */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">Biografía Reescrita para Ventas</h4>
                    <button
                      onClick={() => copyToClipboard(bioResult.optimizedBio, 'bio')}
                      className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium text-[11px]"
                    >
                      {copiedKey === 'bio' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copiar Bio</span>
                    </button>
                  </div>
                  <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 whitespace-pre-wrap text-neutral-200 font-mono leading-relaxed">
                    {bioResult.optimizedBio}
                  </div>
                </div>

                {/* Historias Destacadas Sugeridas */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 space-y-2">
                  <h4 className="font-bold text-neutral-300">Historias Destacadas Clave (Highlights)</h4>
                  <div className="flex flex-wrap gap-2">
                    {bioResult.storyHighlightsIdeas.map((hl, idx) => (
                      <span key={idx} className="bg-neutral-950 border border-neutral-800 text-neutral-300 px-3 py-1 rounded-xl text-xs">
                        📁 {hl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}