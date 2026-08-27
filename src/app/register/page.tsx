'use client';

import { useState } from 'react';
import { registerAction } from '@/app/auth/actions';
import Link from 'next/link';
import { Loader2, ArrowRight, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await registerAction(formData);

    if (res && !res.success) {
      setErrorMsg(res.error || 'Error al registrar usuario');
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center font-black text-neutral-950 text-base shadow-lg shadow-emerald-950/50">
            OS
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Comienza con tu Tienda</h1>
          <p className="text-xs text-neutral-400">Automatiza ventas en Instagram en menos de 2 minutos</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-2xl space-y-4 shadow-xl backdrop-blur-sm text-xs">
          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Nombre Completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="fullName"
                type="text"
                required
                placeholder="Carlos Mendoza"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="email"
                type="email"
                required
                placeholder="tu@negocio.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-2 shadow-lg shadow-emerald-950/40"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Crear mi Cuenta</span>
            {!isPending && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}