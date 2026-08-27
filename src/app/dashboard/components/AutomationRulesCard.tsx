'use client';

import { useState } from 'react';
import { createAutomationRule, toggleAutomationRule } from '../actions';
import { MessageSquareCode, Plus, Sparkles } from 'lucide-react';

export interface Rule {
  id: string;
  trigger_keyword: string;
  reply_message: string;
  is_active: boolean;
}

export default function AutomationRulesCard({
  organizationId,
  rules,
}: {
  organizationId: string;
  rules: Rule[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [message, setMessage] = useState('¡Hola! Compra directamente aquí: {{store_url}}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createAutomationRule(organizationId, keyword, message);
    setIsSubmitting(false);

    if (res.success) {
      setKeyword('');
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg">
            <MessageSquareCode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-neutral-200">Reglas de Conversión por Auto-DM</h3>
            <p className="text-xs text-neutral-400">Dispara mensajes cuando comenten tus posts</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nueva Regla</span>
        </button>
      </div>

      {/* Formulario Nueva Regla */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Palabra Clave (Trigger)</label>
            <input
              required
              placeholder="Ej: PRECIO, INFO, COMPRAR"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
              Mensaje Privado (Usa <span className="text-emerald-400 font-mono">{'{{store_url}}'}</span> para tu enlace)
            </label>
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-xs transition"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Regla'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Reglas */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">No hay reglas de automatización activas.</p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-neutral-950/60 border border-neutral-800/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    {rule.trigger_keyword}
                  </span>
                  <Sparkles className="w-3 h-3 text-neutral-500" />
                </div>
                <p className="text-neutral-400 line-clamp-1 text-[11px] mt-1">{rule.reply_message}</p>
              </div>

              <button
                onClick={() => toggleAutomationRule(rule.id, rule.is_active)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[10px] transition cursor-pointer ${
                  rule.is_active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {rule.is_active ? 'Activa' : 'Pausada'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}