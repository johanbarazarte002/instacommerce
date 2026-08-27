'use client';

import { useState } from 'react';
import { syncBcvRate, setCustomCurrencyRate } from '../actions';
import { RefreshCw, DollarSign, Building2, Sliders, Check } from 'lucide-react';

interface Props {
  organizationId: string;
  initialRate: number;
  initialMode: 'bcv' | 'custom';
  lastSynced?: string;
}

export default function ExchangeRateCard({
  organizationId,
  initialRate,
  initialMode,
  lastSynced,
}: Props) {
  const [mode, setMode] = useState<'bcv' | 'custom'>(initialMode);
  const [currentRate, setCurrentRate] = useState<number>(initialRate);
  const [customRateInput, setCustomRateInput] = useState<number>(initialRate);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sincronizar BCV
  const handleSyncBcv = async () => {
    setIsLoading(true);
    setFeedback(null);
    const res = await syncBcvRate(organizationId);
    setIsLoading(false);

    if (res.success && res.rate) {
      setCurrentRate(res.rate);
      setCustomRateInput(res.rate);
      setMode('bcv');
      setFeedback(`Sincronizado con BCV: Bs. ${res.rate.toFixed(2)}`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Guardar Tasa Personalizada
  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const res = await setCustomCurrencyRate(organizationId, customRateInput);
    setIsLoading(false);

    if (res.success) {
      setCurrentRate(customRateInput);
      setMode('custom');
      setFeedback(`Tasa manual fijada: Bs. ${customRateInput.toFixed(2)}`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-neutral-200">Tasa de Cambio (USD / VES)</h3>
            <p className="text-xs text-neutral-400">
              Activa: <span className="font-bold text-white font-mono">Bs. {Number(currentRate).toFixed(2)}</span> ({mode === 'bcv' ? 'Oficial BCV' : 'Personalizada'})
            </p>
          </div>
        </div>
      </div>

      {/* Selector de Modo */}
      <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
        <button
          type="button"
          onClick={() => setMode('bcv')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
            mode === 'bcv'
              ? 'bg-neutral-800 text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          Automática (BCV)
        </button>

        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium transition cursor-pointer ${
            mode === 'custom'
              ? 'bg-neutral-800 text-white font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          Manual / Margen
        </button>
      </div>

      {/* Contenido según el modo */}
      {mode === 'bcv' ? (
        <div className="bg-neutral-950/60 border border-neutral-800 p-4 rounded-xl flex items-center justify-between gap-3">
          <div className="text-xs">
  <p className="font-semibold text-neutral-200">Sincronización con Banco Central</p>
  <p className="text-[11px] text-neutral-500" suppressHydrationWarning>
    {lastSynced
      ? `Última vez: ${new Date(lastSynced).toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}`
      : 'Sincroniza con 1 clic'}
  </p>
</div>

          <button
            type="button"
            disabled={isLoading}
            onClick={handleSyncBcv}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sincronizar BCV</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSaveCustom} className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-bold">Bs.</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customRateInput}
              onChange={(e) => setCustomRateInput(parseFloat(e.target.value) || 0)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono focus:outline-none focus:border-neutral-600"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || customRateInput === currentRate}
            className="bg-neutral-100 hover:bg-white text-neutral-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Aplicar
          </button>
        </form>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs py-2 px-3 rounded-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}