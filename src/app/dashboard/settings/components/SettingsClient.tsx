'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveInstagramCredentials, disconnectInstagramAccount } from '../actions';
import { getMetaOAuthUrl } from '@/lib/auth/meta-oauth';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Unlink,
  Key,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ConnectedAccount {
  id: string;
  instagram_business_id: string;
  page_id: string;
  username: string;
  access_token: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  organizationId: string;
  orgName: string;
  orgSlug: string;
  connectedAccount: ConnectedAccount | null;
}

export default function SettingsClient({
  organizationId,
  orgName,
  orgSlug,
  connectedAccount,
}: Props) {
  const searchParams = useSearchParams();

  // Estados del Formulario Manual
  const [showManualForm, setShowManualForm] = useState(false);
  const [igBusinessId, setIgBusinessId] = useState(connectedAccount?.instagram_business_id || '');
  const [pageId, setPageId] = useState(connectedAccount?.page_id || '');
  const [accessToken, setAccessToken] = useState(connectedAccount?.access_token || '');

  const [isLoading, setIsLoading] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Derivación de estado limpio desde la URL (Cero efectos secundarios ni renders en cascada)
  const successParam = searchParams.get('success');
  const userParam = searchParams.get('user');
  const errorParam = searchParams.get('error');

  const urlFeedback =
    successParam === 'connected'
      ? {
          type: 'success' as const,
          message: `¡Cuenta @${userParam || 'vinculada'} conectada con éxito mediante Meta OAuth!`,
        }
      : errorParam
      ? {
          type: 'error' as const,
          message: decodeURIComponent(errorParam),
        }
      : null;

  // El feedback manual toma prioridad sobre el de la URL
  const feedback = manualFeedback || urlFeedback;

  // Guardar credenciales manualmente
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setManualFeedback(null);

    const res = await saveInstagramCredentials({
      organizationId,
      instagramBusinessId: igBusinessId,
      pageId,
      accessToken,
    });

    setIsLoading(false);

    if (res.success) {
      setManualFeedback({
        type: 'success',
        message: `¡Conexión manual exitosa con @${res.username}!`,
      });
    } else {
      setManualFeedback({
        type: 'error',
        message: res.error || 'Error al conectar con Meta',
      });
    }
  };

  // Desconectar cuenta
  const handleDisconnect = async () => {
    if (!confirm('¿Desvincular esta cuenta de Instagram? Los Auto-DMs dejarán de responder.')) return;
    setIsLoading(true);
    await disconnectInstagramAccount(organizationId);
    setIsLoading(false);
    setIgBusinessId('');
    setPageId('');
    setAccessToken('');
    setManualFeedback({ type: 'success', message: 'Cuenta de Instagram desvinculada correctamente.' });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Notificación Toast de Éxito / Error */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-red-950/50 border-red-800 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{feedback.message}</span>
        </div>
      )}

      {/* MÉTODO 1: Banner Principal OAuth en 1 Clic (Para el Usuario Final) */}
      {!connectedAccount && (
        <div className="bg-gradient-to-r from-purple-950/40 via-pink-950/30 to-amber-950/20 border border-purple-800/40 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 bg-pink-500/10 border border-pink-500/20 px-2.5 py-0.5 rounded-full text-pink-400 text-[10px] font-bold">
              <Camera className="w-3 h-3" />
              <span>Recomendado</span>
            </div>
            <h3 className="font-bold text-sm text-white">Conexión Rápida en 1 Clic</h3>
            <p className="text-xs text-neutral-300 max-w-md">
              Inicia sesión con Facebook para sincronizar automáticamente tu cuenta empresarial de Instagram sin copiar claves ni tokens técnicos.
            </p>
          </div>

          <a
            href={getMetaOAuthUrl(organizationId)}
            className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-90 text-white font-bold px-6 py-3 rounded-2xl text-xs flex items-center gap-2 transition shadow-xl shrink-0 cursor-pointer shadow-pink-950/50"
          >
            <Camera className="w-4 h-4" />
            <span>Conectar con Instagram</span>
          </a>
        </div>
      )}

      {/* Tarjeta de Estado de la Cuenta */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-3xl p-6 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
              <div className="w-full h-full bg-neutral-950 rounded-2xl flex items-center justify-center text-white">
                <Camera className="w-5 h-5" />
              </div>  
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Estado de Integración de Meta</span>
                {connectedAccount ? (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    Conectado (@{connectedAccount.username})
                  </span>
                ) : (
                  <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2.5 py-0.5 rounded-full font-medium">
                    No vinculado
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                {connectedAccount
                  ? `Respuestas automáticas activas para @${connectedAccount.username}`
                  : 'Conecta tu cuenta para que el bot responda comentarios y publique en el feed'}
              </p>
            </div>
          </div>

          {connectedAccount && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handleDisconnect}
              className="text-neutral-400 hover:text-red-400 border border-neutral-800 hover:border-red-800/60 bg-neutral-950 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          )}
        </div>

        {/* MÉTODO 2: Acordeón para Configuración Manual / Desarrollador */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-xs text-neutral-400 hover:text-white flex items-center justify-between w-full p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-neutral-500" />
              <span className="font-semibold">Configuración Manual Avanzada (Tokens / IDs)</span>
            </div>
            {showManualForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs bg-neutral-950/40 p-4 rounded-2xl border border-neutral-800/60 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Instagram Business Account ID
                  </label>
                  <input
                    required
                    placeholder="Ej: 17841400012345678"
                    value={igBusinessId}
                    onChange={(e) => setIgBusinessId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-semibold mb-1">
                    Facebook Page ID (Página vinculada)
                  </label>
                  <input
                    required
                    placeholder="Ej: 100098765432100"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-neutral-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Meta Access Token (Token de Larga Duración)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="EAAB..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-neutral-100 hover:bg-white text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Verificar y Guardar Manualmente</span>
                </button>
              </div>

              {/* Ayuda Técnica */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 space-y-1.5 text-[11px] text-neutral-400">
                <p className="font-semibold text-neutral-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Permisos necesarios en Meta Developers:</span>
                </p>
                <p className="font-mono text-neutral-400">
                  instagram_basic, instagram_manage_comments, instagram_manage_messages, pages_show_list, pages_manage_posts.
                </p>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                >
                  Abrir Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}