'use client';

import { useState } from 'react';
import { createScheduledPost, updateGridPositions, deleteScheduledPost } from '../actions';
import { generateInstagramPost } from '@/app/dashboard/ai/actions';
import {
  Plus,
  Trash2,
  Calendar,
  UploadCloud,
  X,
  Loader2,
  Sparkles,
  Film,
  Image as ImageIcon,
  Layers,
  Wand2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface ScheduledPost {
  id: string;
  caption: string | null;
  media_urls: string[];
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  grid_position: number;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduled_for: string | null;
}

interface Props {
  organizationId: string;
  orgName: string;
  initialPosts: ScheduledPost[];
}

export default function GridPlannerClient({ organizationId, orgName, initialPosts }: Props) {
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modal Crear
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newScheduledFor, setNewScheduledFor] = useState('');
  const [uploadedMediaUrls, setUploadedMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'CAROUSEL'>('IMAGE');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Integración IA In-Modal
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiContentType, setAiContentType] = useState<'POST' | 'REEL'>('POST');
  const [aiProduct, setAiProduct] = useState('');
  const [aiKeyword, setAiKeyword] = useState('PRECIO');
  const [aiCity, setAiCity] = useState('Caracas');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Modal Detalle & Slider Carrusel
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- DRAG & DROP NATIVO 60 FPS ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    const updated = [...posts];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setPosts(updated);
    setDraggedIndex(null);

    const payload = updated.map((p, idx) => ({
      id: p.id,
      grid_position: updated.length - idx,
    }));

    await updateGridPositions(organizationId, payload);
  };

  // --- SUBIDA MÚLTIPLE A IMAGEKIT (FOTOS, VIDEOS O CARRUSELES) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const hasVideo = fileList.some((f) => f.type.startsWith('video/'));

    setIsUploading(true);

    try {
      const authRes = await fetch('/api/imagekit/auth');
      const authData = await authRes.json();

      // Subida paralela a la CDN de ImageKit
      const uploadPromises = fileList.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append(
          'fileName',
          `${file.type.startsWith('video/') ? 'reel' : 'slide'}_${Date.now()}_${file.name}`
        );
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
        formData.append('signature', authData.signature);
        formData.append('expire', authData.expire);
        formData.append('token', authData.token);

        const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          body: formData,
        });

        const resJson = await uploadRes.json();
        return resJson.url as string;
      });

      const newUrls = await Promise.all(uploadPromises);
      const combined = [...uploadedMediaUrls, ...newUrls];
      setUploadedMediaUrls(combined);

      // Determinar tipo de medio automáticamente
      if (hasVideo) {
        setMediaType('VIDEO');
        setAiContentType('REEL');
      } else if (combined.length > 1) {
        setMediaType('CAROUSEL');
        setAiContentType('POST');
      } else {
        setMediaType('IMAGE');
        setAiContentType('POST');
      }
    } catch (error) {
      console.error('Error subiendo archivos a ImageKit:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = uploadedMediaUrls.filter((_, idx) => idx !== indexToRemove);
    setUploadedMediaUrls(updated);
    if (updated.length > 1) {
      setMediaType('CAROUSEL');
    } else if (updated.length === 1) {
      setMediaType('IMAGE');
    }
  };

  // --- GENERACIÓN CON IA ---
  const handleGenerateAiCopy = async () => {
    if (!aiProduct.trim()) return;

    setIsGeneratingAi(true);
    const res = await generateInstagramPost({
      productName: aiProduct,
      niche: 'Comercio General',
      targetCity: aiCity,
      keyBenefit: 'Calidad garantizada y despacho rápido',
      triggerKeyword: aiKeyword,
      contentType: aiContentType,
    });
    setIsGeneratingAi(false);

    if (res.success && res.data) {
      const { seoKeywords, caption } = res.data;
      const formattedKeywords = seoKeywords.map((k: string) => `#${k.replace(/\s+/g, '')}`).join(' ');

      let fullCopy = '';
      if (aiContentType === 'REEL') {
        fullCopy = `🎬 [HOOK EN PANTALLA (3s)]:\n${res.data.hookVisual}\n\n🎙️ [VOZ EN OFF]:\n"${res.data.audioHook}"\n\n📝 [CAPTION]:\n${caption}\n\n🔍 [SEO LOCAL]:\n${formattedKeywords}`;
      } else {
        fullCopy = `📌 [TITULAR / PORTADA DEL ${mediaType === 'CAROUSEL' ? 'CARRUSEL' : 'POST'}]:\n${res.data.headline}\n\n📝 [DESCRIPCIÓN]:\n${caption}\n\n🔍 [SEO LOCAL]:\n${formattedKeywords}`;
      }

      setNewCaption(fullCopy);
      setIsAiOpen(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedMediaUrls.length === 0) return;

    setIsSaving(true);
    const res = await createScheduledPost({
      organizationId,
      caption: newCaption,
      mediaUrls: uploadedMediaUrls,
      mediaType: mediaType,
      scheduledFor: newScheduledFor ? new Date(newScheduledFor).toISOString() : null,
    });
    setIsSaving(false);

    if (res.success && res.post) {
      setPosts([res.post as ScheduledPost, ...posts]);
      setIsCreateModalOpen(false);
      setUploadedMediaUrls([]);
      setNewCaption('');
      setNewScheduledFor('');
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('¿Eliminar esta publicación del feed?')) return;
    setIsDeleting(true);
    await deleteScheduledPost(postId);
    setIsDeleting(false);
    setSelectedPost(null);
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const openDetailModal = (post: ScheduledPost) => {
    setSelectedPost(post);
    setActiveSlideIndex(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Visual Grid Planner (Feed, Carruseles & Reels)</h2>
          <p className="text-xs text-neutral-400">Organiza publicaciones simples, carruseles de fotos y reels de video</p>
        </div>

        <button
          onClick={() => {
            setUploadedMediaUrls([]);
            setIsCreateModalOpen(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-950/30"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Post / Carrusel</span>
        </button>
      </div>

      {/* Frame Instagram */}
      <div className="max-w-md mx-auto bg-neutral-900/70 border border-neutral-800 rounded-3xl p-4 shadow-2xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between px-2 pt-1 border-b border-neutral-800/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2px]">
              <div className="w-full h-full bg-neutral-950 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase">
                {orgName.slice(0, 2)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-white">@{orgName.toLowerCase().replace(/\s+/g, '')}</p>
              <p className="text-[10px] text-neutral-400">En maqueta: {posts.length} publicaciones</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full">
            Feed 3x3
          </span>
        </div>

        {/* Grid Interactivo */}
        {posts.length === 0 ? (
          <div className="aspect-square border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-neutral-500 text-xs p-6 text-center">
            <Sparkles className="w-8 h-8 text-neutral-700 mb-2" />
            <span>El grid está vacío. Sube fotos, carruseles o reels para estructurar tu feed.</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 md:gap-1.5 rounded-2xl overflow-hidden bg-neutral-950 p-1 border border-neutral-800/80">
            {posts.map((post, index) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => openDetailModal(post)}
                className={`aspect-square relative bg-neutral-900 cursor-grab active:cursor-grabbing group overflow-hidden transition-all duration-150 rounded-lg ${
                  draggedIndex === index ? 'opacity-25 scale-90 border-2 border-dashed border-emerald-500' : 'hover:opacity-90'
                }`}
              >
                {post.media_type === 'VIDEO' ? (
                  <div className="w-full h-full relative">
                    <video
                      src={post.media_urls[0]}
                      muted
                      loop
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white p-1 rounded-md text-[9px]">
                      <Film className="w-2.5 h-2.5 text-pink-400" />
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${post.media_urls[0]}?tr=w-400,q-80`}
                      alt="Feed post"
                      draggable={false}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    {/* Badge de Carrusel */}
                    {post.media_urls.length > 1 && (
                      <span className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-md text-[9px] flex items-center gap-1 font-mono">
                        <Layers className="w-2.5 h-2.5 text-amber-400" />
                        <span>{post.media_urls.length}</span>
                      </span>
                    )}
                  </div>
                )}

                {post.status === 'scheduled' && post.media_urls.length === 1 && (
                  <span className="absolute top-1.5 right-1.5 bg-blue-600/90 text-white p-1 rounded-md text-[9px]">
                    <Calendar className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Post / Carrusel */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">
                  {mediaType === 'CAROUSEL'
                    ? `Nuevo Carrusel (${uploadedMediaUrls.length} fotos)`
                    : mediaType === 'VIDEO'
                    ? 'Nuevo Reel'
                    : 'Nuevo Post'}
                </h2>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Uploader ImageKit con soporte MÚLTIPLE */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-neutral-400 font-semibold">
                    Archivos Creativos (Selecciona 1 o varias fotos / video)
                  </label>
                  {uploadedMediaUrls.length > 0 && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      {uploadedMediaUrls.length} archivo(s)
                    </span>
                  )}
                </div>

                <div className="border border-dashed border-neutral-700 rounded-xl p-3 bg-neutral-950/50 space-y-3">
                  {/* Grid de Miniaturas Subidas */}
                  {uploadedMediaUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedMediaUrls.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 group">
                          {mediaType === 'VIDEO' ? (
                            <video src={url} className="w-full h-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${url}?tr=w-200,q-80`} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white p-0.5 rounded-full transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] font-mono px-1 rounded text-white">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input de Subida */}
                  <label className="cursor-pointer flex flex-col items-center justify-center py-3 hover:bg-neutral-900/40 rounded-lg transition border border-dashed border-neutral-800">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                        <span className="text-neutral-400 text-[11px]">Subiendo archivos a ImageKit...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-neutral-400 mb-1" />
                        <span className="text-neutral-300 font-medium">
                          {uploadedMediaUrls.length > 0 ? '+ Agregar más imágenes al carrusel' : 'Seleccionar Fotos o Video'}
                        </span>
                        <span className="text-[10px] text-neutral-500 mt-0.5">Puedes seleccionar múltiples fotos a la vez</span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/mp4,video/quicktime,video/webm"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sección Caption & Asistente IA */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-neutral-400 font-semibold">Descripción / Caption</label>
                  <button
                    type="button"
                    onClick={() => setIsAiOpen(!isAiOpen)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>{isAiOpen ? 'Cerrar IA' : '✨ Generar con DeepSeek'}</span>
                  </button>
                </div>

                {/* Sub-Panel de IA */}
                {isAiOpen && (
                  <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl space-y-3 mb-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-semibold mb-1">Formato</label>
                      <div className="grid grid-cols-2 gap-2 bg-neutral-900 p-1 rounded-lg border border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setAiContentType('POST')}
                          className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 font-semibold text-[11px] transition ${
                            aiContentType === 'POST' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{mediaType === 'CAROUSEL' ? 'Carrusel' : 'Post'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAiContentType('REEL')}
                          className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 font-semibold text-[11px] transition ${
                            aiContentType === 'REEL' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Film className="w-3.5 h-3.5 text-pink-400" />
                          <span>Reel (Video)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 font-semibold mb-1">Producto o Tema</label>
                      <input
                        placeholder="Ej: Colección Franelas Acid Wash Streetwear"
                        value={aiProduct}
                        onChange={(e) => setAiProduct(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-semibold mb-1">Palabra Trigger</label>
                        <input
                          placeholder="PRECIO"
                          value={aiKeyword}
                          onChange={(e) => setAiKeyword(e.target.value.toUpperCase())}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 font-semibold mb-1">Ciudad Objetivo</label>
                        <input
                          placeholder="Caracas"
                          value={aiCity}
                          onChange={(e) => setAiCity(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-neutral-600"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingAi || !aiProduct.trim()}
                      onClick={handleGenerateAiCopy}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-neutral-950 font-bold py-2 rounded-lg transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer text-xs"
                    >
                      {isGeneratingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Generar Copy con DeepSeek</span>
                    </button>
                  </div>
                )}

                <textarea
                  rows={4}
                  placeholder="Escribe la descripción de tu carrusel/post o genérala con IA..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">Programar Fecha y Hora (Opcional)</label>
                <input
                  type="datetime-local"
                  value={newScheduledFor}
                  onChange={(e) => setNewScheduledFor(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-neutral-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || uploadedMediaUrls.length === 0}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Guardar en Grid</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle con Visor Deslizable para Carruseles */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <span className="font-bold text-white flex items-center gap-1.5">
                {selectedPost.media_type === 'VIDEO' ? (
                  <Film className="w-3.5 h-3.5 text-pink-400" />
                ) : selectedPost.media_urls.length > 1 ? (
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {selectedPost.media_type === 'VIDEO'
                    ? 'Reel'
                    : selectedPost.media_urls.length > 1
                    ? `Carrusel (${activeSlideIndex + 1}/${selectedPost.media_urls.length})`
                    : 'Post'}
                </span>
              </span>
              <button onClick={() => setSelectedPost(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visor de Medios / Carrusel */}
            <div className="aspect-square rounded-xl overflow-hidden bg-neutral-950 relative flex items-center justify-center">
              {selectedPost.media_type === 'VIDEO' ? (
                <video src={selectedPost.media_urls[0]} controls autoPlay loop playsInline className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${selectedPost.media_urls[activeSlideIndex]}?tr=w-500,q-80`}
                  alt={`Slide ${activeSlideIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Controles de Navegación del Carrusel */}
              {selectedPost.media_urls.length > 1 && (
                <>
                  {activeSlideIndex > 0 && (
                    <button
                      onClick={() => setActiveSlideIndex((prev) => prev - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black p-1.5 rounded-full text-white transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {activeSlideIndex < selectedPost.media_urls.length - 1 && (
                    <button
                      onClick={() => setActiveSlideIndex((prev) => prev + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black p-1.5 rounded-full text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {/* Puntos Indicadores */}
                  <div className="absolute bottom-2 flex gap-1">
                    {selectedPost.media_urls.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          activeSlideIndex === i ? 'bg-white w-3' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {selectedPost.caption && (
              <p className="text-neutral-300 bg-neutral-950 p-3 rounded-xl border border-neutral-800 whitespace-pre-wrap max-h-36 overflow-y-auto">
                {selectedPost.caption}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(selectedPost.id)}
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>

              <button
                onClick={() => setSelectedPost(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-1.5 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}