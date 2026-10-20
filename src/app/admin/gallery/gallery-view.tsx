"use client";

import * as React from "react";
import {
  addGalleryImage,
  deleteGalleryImage,
  type GalleryActionResult,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Tag,
} from "lucide-react";

interface GalleryImage {
  id: string;
  business_id: string;
  image_url: string;
  category: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
  professionals?: {
    name: string;
  };
}

interface GalleryViewProps {
  business: any;
  images: GalleryImage[];
  professionals: any[];
}

export function GalleryView({
  business,
  images: initialImages,
  professionals,
}: GalleryViewProps) {
  const [images, setImages] = React.useState(initialImages);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [feedback, setFeedback] = React.useState<GalleryActionResult | null>(null);

  // Extraer categorías únicas
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    images.forEach((img) => {
      if (img.category) set.add(img.category);
    });
    return Array.from(set);
  }, [images]);

  // Filtrar imágenes por categoría
  const filteredImages = React.useMemo(() => {
    if (selectedCategory === "all") return images;
    return images.filter((img) => img.category === selectedCategory);
  }, [images, selectedCategory]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Galería de Trabajos y Portfolio
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Sube fotos de tus mejores cortes, coloraciones y servicios para exhibirlos en tu página pública
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowUploadModal(true)}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Subir Foto a la Galería</span>
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.error
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.error ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.error || feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="underline font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Modal Subir Foto */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-pink-600" />
                Subir Foto a la Galería
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Las fotos se almacenan en Supabase Storage y se muestran en tu página pública
              </p>
            </div>

            <form
              action={async (formData) => {
                const res = await addGalleryImage(formData);
                setFeedback(res);
                if (res.success) setShowUploadModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <input type="hidden" name="business_id" value={business.id} />

              <div className="space-y-1">
                <Label>Seleccionar Archivo de Imagen</Label>
                <Input
                  type="file"
                  name="image_file"
                  accept="image/png, image/jpeg, image/webp"
                  className="cursor-pointer file:cursor-pointer text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>O ingresar URL de Imagen externa</Label>
                <Input
                  name="image_url"
                  placeholder="https://ejemplo.com/foto-balayage.jpg"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Categoría</Label>
                  <Input
                    name="category"
                    placeholder="Ej. Balayage, Uñas, Barba..."
                    defaultValue="Corte y Color"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Profesional (opcional)</Label>
                  <select
                    name="professional_id"
                    className="flex h-9 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="">Todo el Local</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Descripción o Pie de Foto (opcional)</Label>
                <Input
                  name="caption"
                  placeholder="Ej. Balayage miel en cabello castaño con ondas al agua"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Guardar Foto</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros de Categorías */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
            selectedCategory === "all"
              ? "bg-pink-600 text-white shadow-xs"
              : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          }`}
        >
          Todas ({images.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
              selectedCategory === cat
                ? "bg-pink-600 text-white shadow-xs"
                : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grilla de Fotos */}
      {filteredImages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <ImageIcon className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold">No hay fotos en la galería aún</p>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Sube tus mejores trabajos fotográficos para cautivar a tus clientes en la página web.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <Card key={img.id} className="overflow-hidden group flex flex-col justify-between">
              <div className="aspect-square relative overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={img.image_url}
                  alt={img.caption || "Foto de trabajo"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {img.category && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-[10px] shadow-xs backdrop-blur-xs bg-white/90 dark:bg-neutral-900/90">
                      {img.category}
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-3 text-xs space-y-2">
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                    {img.caption || "Sin descripción"}
                  </p>
                  {img.professionals?.name && (
                    <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" />
                      <span>{img.professionals.name}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end pt-1 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("¿Eliminar esta foto de la galería?")) {
                        const res = await deleteGalleryImage(img.id);
                        setFeedback(res);
                        if (res.success) {
                          setImages((prev) => prev.filter((i) => i.id !== img.id));
                        }
                      }
                    }}
                    className="text-neutral-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    title="Eliminar foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
