"use client";

import * as React from "react";
import { createBusinessOnboarding, type OnboardingState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Building2,
  Globe,
  Palette,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  MessageCircle,
} from "lucide-react";

const COLOR_PRESETS = [
  { name: "Rosa Chic", hex: "#ec4899" },
  { name: "Borgoña Elegante", hex: "#881337" },
  { name: "Lavanda Moderno", hex: "#8b5cf6" },
  { name: "Esmeralda Spa", hex: "#059669" },
  { name: "Dorado Cálido", hex: "#d97706" },
  { name: "Negro Minimal", hex: "#171717" },
];

export default function OnboardingPage() {
  const [state, formAction, isPending] = React.useActionState<OnboardingState, FormData>(
    createBusinessOnboarding,
    {}
  );

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [selectedColor, setSelectedColor] = React.useState("#ec4899");
  const [phone, setPhone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [sameAsPhone, setSameAsPhone] = React.useState(true);

  // Auto-generar slug sugerido cuando escribe el nombre
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const suggested = val
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(suggested);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Configuración Inicial de tu Negocio
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white">
            ¡Bienvenido a RESERVAPP!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Configura tu espacio en 2 minutos para comenzar a recibir reservas de tus clientes.
          </p>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 p-4 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-900">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {/* Tarjeta 1: Identidad del Negocio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-pink-600" />
                Identidad de tu Negocio
              </CardTitle>
              <CardDescription>
                Información visible para tus clientes en tu página pública de reservas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" required>
                  Nombre del Negocio o Local
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ej. Salón Belleza & Glamour"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rubro" required>
                  Rubro principal
                </Label>
                <select
                  id="rubro"
                  name="rubro"
                  defaultValue="belleza_y_estetica"
                  className="flex h-10 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                >
                  <option value="belleza_y_estetica">Peluquería y Salón de Belleza</option>
                  <option value="barberia">Barbería y Estética Masculina</option>
                  <option value="unas_manicure">Manicure, Pedicure y Nail Art</option>
                  <option value="spa_masajes">Spa, Masajes y Relajación</option>
                  <option value="estetica_facial">Estética Facial y Corporal</option>
                  <option value="otro">Otro Servicio con Reserva de Hora</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" required>
                  Enlace único de reservas (URL)
                </Label>
                <div className="relative">
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="salon-glamour"
                    prefixNode={<Globe className="w-4 h-4" />}
                    required
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Tus clientes reservarán en:{" "}
                  <span className="font-semibold text-pink-600">
                    reservapp.cl/{slug || "tu-negocio"}
                  </span>
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-pink-600" />
                  Color principal de tu marca
                </Label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setSelectedColor(preset.hex)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                      style={{
                        borderColor:
                          selectedColor === preset.hex ? preset.hex : "transparent",
                        backgroundColor:
                          selectedColor === preset.hex
                            ? `${preset.hex}15`
                            : "transparent",
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: preset.hex }}
                      >
                        {selectedColor === preset.hex && <Check className="w-3 h-3" />}
                      </span>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    name="brand_color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                    title="Color personalizado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta 2: Contacto & Sucursal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-5 h-5 text-pink-600" />
                Contacto y Ubicación
              </CardTitle>
              <CardDescription>
                Datos para que tus clientes se comuniquen contigo y ubiquen tu local
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" required>
                    Teléfono del local (Chile)
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+56 9 1234 5678"
                    prefixNode={<Phone className="w-4 h-4" />}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" required>
                    WhatsApp para avisos
                  </Label>
                  <Input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(e.target.value);
                      setSameAsPhone(false);
                    }}
                    placeholder="+56 9 1234 5678"
                    prefixNode={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_name">Nombre de la sucursal matriz</Label>
                <Input
                  id="branch_name"
                  name="branch_name"
                  defaultValue="Casa Central"
                  placeholder="Ej. Casa Central Providencia"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="address" required>
                    Dirección (calle y número / local)
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Av. Providencia 2133, Local 12"
                    prefixNode={<MapPin className="w-4 h-4" />}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Comuna / Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue="Santiago"
                    placeholder="Santiago"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-lg shadow-pink-200 dark:shadow-none"
            isLoading={isPending}
          >
            Crear mi espacio y pasar al panel
          </Button>
        </form>
      </div>
    </div>
  );
}
