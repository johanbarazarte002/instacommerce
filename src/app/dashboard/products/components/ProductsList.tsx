'use client';

import { useState } from 'react';
import { toggleProductStatus, deleteProduct } from '../actions';
import { Product } from '@/types/storefront';
import ProductFormModal from './ProductFormModal';
import { Plus, Trash2, Power, Image as ImageIcon } from 'lucide-react';

interface Props {
  organizationId: string;
  initialProducts: Product[];
}

export default function ProductsList({ organizationId, initialProducts }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleToggle = async (productId: string, currentStatus: boolean) => {
    setProcessingId(productId);
    await toggleProductStatus(productId, currentStatus);
    setProcessingId(null);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    setProcessingId(productId);
    await deleteProduct(productId);
    setProcessingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Inventario & Catálogo</h2>
          <p className="text-xs text-neutral-400">Administra tus productos visibles en el Storefront</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-950/30"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Grid de Productos */}
      {initialProducts.length === 0 ? (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center text-xs text-neutral-500">
          No tienes productos creados. Agrega tu primer producto para que aparezca en tu Storefront.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {initialProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-neutral-900/60 border rounded-2xl overflow-hidden flex flex-col justify-between transition ${
                product.is_active ? 'border-neutral-800' : 'border-neutral-800/40 opacity-60'
              }`}
            >
              {/* Imagen con CDN de ImageKit */}
              <div className="aspect-square bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${product.images[0]}?tr=w-500,q-80`}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-neutral-700" />
                )}
                
                <span className="absolute top-2 left-2 bg-neutral-950/80 backdrop-blur-md text-white font-mono text-[10px] px-2 py-0.5 rounded-md border border-neutral-800">
                  Stock: {product.stock}
                </span>
              </div>

              {/* Info y Acciones */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-white line-clamp-1">{product.title}</h3>
                  <p className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                    ${(product.price_usd_cents / 100).toFixed(2)} USD
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs">
                  <button
                    disabled={processingId === product.id}
                    onClick={() => handleToggle(product.id, product.is_active)}
                    className={`flex items-center gap-1 text-[11px] font-semibold transition ${
                      product.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-500 hover:text-neutral-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {product.is_active ? 'Activo' : 'Pausado'}
                  </button>

                  <button
                    disabled={processingId === product.id}
                    onClick={() => handleDelete(product.id)}
                    className="text-neutral-500 hover:text-red-400 p-1 rounded-lg transition"
                    title="Eliminar Producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación */}
      <ProductFormModal
        organizationId={organizationId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}