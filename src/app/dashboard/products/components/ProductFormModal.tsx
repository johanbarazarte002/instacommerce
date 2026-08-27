'use client';

import { useState } from 'react';
import { createProduct } from '../actions';
import { X, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductFormModal({ organizationId, isOpen, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Subida directa del archivo a ImageKit
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg(null);

    try {
      // 1. Obtener firma de autenticación desde nuestro endpoint
      const authRes = await fetch('/api/imagekit/auth');
      if (!authRes.ok) throw new Error('Error al autenticar con ImageKit');
      const authData = await authRes.json();

      // 2. Preparar el FormData para ImageKit
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', `${Date.now()}_${file.name}`);
      formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
      formData.append('signature', authData.signature);
      formData.append('expire', authData.expire);
      formData.append('token', authData.token);

      // 3. Subir directo a la API de ImageKit
      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Error en la subida a ImageKit');

      const uploadResult = await uploadRes.json();
      setImageUrl(uploadResult.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fallo en la subida de imagen';
      setErrorMsg(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await createProduct({
      organizationId,
      title,
      description,
      priceUsd: parseFloat(priceUsd) || 0,
      stock: parseInt(stock, 10) || 0,
      images: imageUrl ? [imageUrl] : [],
    });

    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al guardar el producto');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="font-bold text-sm text-white">Nuevo Producto</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 bg-red-950/50 border border-red-800 text-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Subidor de Imagen con ImageKit */}
          <div>
            <label className="block text-neutral-400 font-semibold mb-1.5">Foto del Producto (ImageKit CDN)</label>
            <div className="border border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl p-4 text-center relative flex flex-col items-center justify-center bg-neutral-950/50 transition">
              {imageUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${imageUrl}?tr=w-500,q-80`} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black p-1 rounded-full text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full py-3">
                  {isUploadingImage ? (
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-7 h-7 text-neutral-400 mb-1" />
                      <span className="text-neutral-300 font-medium">Haz clic para subir imagen</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">Optimizado en WebP por ImageKit</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Título del Producto</label>
            <input
              required
              placeholder="Ej: Franela Oversize Acid Wash"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Precio Base (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25.00"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-7 pr-3 text-white focus:outline-none focus:border-neutral-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">Stock Disponible</label>
              <input
                required
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 font-semibold mb-1">Descripción (Opcional)</label>
            <textarea
              rows={2}
              placeholder="Detalles de tela, tallas o especificaciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Guardar Producto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 