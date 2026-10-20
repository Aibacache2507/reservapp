# 🌸 RESERVAPP - SaaS Multi-Negocio de Agendamiento de Citas

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%2B_Auth_%2B_RLS-emerald?logo=supabase)](https://supabase.com/)
[![Resend](https://img.shields.io/badge/Resend-Email_API-black?logo=resend)](https://resend.com/)
[![Licencia](https://img.shields.io/badge/Licencia-Privada-red)](#)

**RESERVAPP** es una plataforma SaaS multi-inquilino (*multi-tenant*) de agendamiento y gestión de citas diseñada específicamente para el mercado de la belleza y bienestar en Chile (peluquerías, salones de manicura, barberías, centros de estética, spas y terapeutas).

Cada negocio registrado cuenta con su propio portal público `/{slug}` donde los clientes pueden agendar hora en pocos pasos **sin necesidad de crearse una cuenta**, recibiendo confirmaciones por correo (Resend) y recordatorios inteligentes por **WhatsApp (`wa.me`)**.

---

## 🇨🇱 Contexto Regional de Chile

- **Moneda:** Pesos Chilenos (**CLP**), números enteros sin decimales con separador de miles por punto (`$12.990`).
- **Zona Horaria:** `America/Santiago`, con almacenamiento en UTC (`timestamptz`) en PostgreSQL y conversión automática a hora local respetando los cambios de horario de verano/invierno.
- **RUT Chileno:** Validación matemática en cliente y servidor con algoritmo **Módulo 11** para el dígito verificador y formateo automático `12.345.678-9`.
- **Teléfonos:** Formato móvil chileno `+56 9 XXXX XXXX`, normalizado a estándar internacional E.164.
- **Regla Estricta sobre WhatsApp:** La plataforma **no utiliza WhatsApp Business API** de pago ni envía mensajes intrusivos; genera enlaces normalizados `https://wa.me/569XXXXXXXX?text=...` con plantillas prellenadas listas para que el local o el cliente solo presionen "Enviar".
- **Pago en el Local:** No se cobra por adelantado; la interfaz y los correos recuerdan que el pago se realiza directamente en la recepción del local.

---

## 🚀 Arquitectura y Tecnologías

- **Frontend:** [Next.js 16 (App Router)](https://nextjs.org/) con compilador Turbopack, TypeScript y Tailwind CSS v4.
- **Backend & Base de Datos:** [Supabase](https://supabase.com/) con PostgreSQL 15+, Supabase Auth con SSR (`@supabase/ssr`), Supabase Storage para fotos de trabajos y extensiones `btree_gist`, `pg_cron` y `pg_net`.
- **Seguridad Multi-Tenant:** **Row Level Security (RLS)** estricto en todas las 27 tablas de la base de datos vinculado a `business_id`.
- **Prevención de Doble Reserva Físico:** Restricción de exclusión física `no_overlapping_active_appointments` en PostgreSQL con `btree_gist` sobre rangos `tstzrange(starts_at, ends_at)` para citas activas.
- **Correos Transaccionales:** [Resend](https://resend.com/) con maquetación HTML responsiva y modo simulación para desarrollo local.
- **PWA (Progressive Web App):** Instalable en teléfonos móviles y escritorios con `manifest.json`, Service Worker offline y metadatos de aplicación.

---

## 📂 Estructura del Proyecto

```
RESERVAPP/
├── public/
│   ├── manifest.json            # Manifiesto PWA para instalación móvil
│   ├── sw.js                    # Service Worker con caché offline
│   └── icon.svg                 # Ícono oficial de la aplicación
├── scripts/
│   ├── verify-stage1.ts         # Pruebas Etapa 1: RUT, CLP, Zona horaria y Migraciones
│   ├── verify-stage2.ts         # Pruebas Etapa 2: Onboarding y Reglas de Reserva
│   ├── verify-stage3.ts         # Pruebas Etapa 3: Flujo cliente, iCalendar y Tokens
│   ├── verify-stage4.ts         # Pruebas Etapa 4: Agenda, Comisiones y Fichas técnicas
│   ├── verify-stage5.ts         # Pruebas Etapa 5: Resend, Plantillas y Cron automático
│   ├── verify-stage6.ts         # Pruebas Etapa 6: Dashboard, Inventario y Exportación CSV
│   ├── verify-stage7.ts         # Pruebas Etapa 7: Galería, Reseñas únicas y Schema.org
│   └── verify-stage8.ts         # Pruebas Etapa 8: Auditoría e2e, Seguridad y PWA
├── src/
│   ├── app/
│   │   ├── [slug]/              # Landing pública del negocio y Wizard de agendamiento
│   │   ├── admin/
│   │   │   ├── calendar/        # Agenda interactiva día/semana y bloqueos
│   │   │   ├── commissions/     # Liquidación de comisiones y reporte Excel (CSV)
│   │   │   ├── dashboard/       # Métricas financieras y KPIs (Ingresos, asistencia, etc.)
│   │   │   ├── gallery/         # Galería de portfolio en Supabase Storage
│   │   │   ├── inventory/       # Stock, compras, consumo en cabina y alertas
│   │   │   ├── loyalty/         # Ranking de clientes VIP (LTV) y moderación de reseñas
│   │   │   ├── notifications/   # Cola de WhatsApp manual y editor de plantillas
│   │   │   ├── onboarding/      # Asistente de creación de nuevo negocio
│   │   │   ├── promotions/      # Cupones de descuento y packs de sesiones
│   │   │   ├── settings/        # Configuración general, servicios y horarios
│   │   │   └── waitlist/        # Gestión de lista de espera con aviso por wa.me
│   │   ├── api/cron/reminders/  # Endpoint de escaneo de recordatorios automáticos
│   │   ├── auth/                # Login, registro y recuperación con Supabase Auth
│   │   ├── reserva/[token]/     # Portal de autogestión sin cuenta y formulario de reseña
│   │   └── superadmin/          # Panel de administración de negocios de la plataforma
│   ├── components/ui/           # Componentes base accesibles (Buttons, Cards, Inputs, etc.)
│   └── lib/
│       ├── notifications/       # Motor de Resend, plantillas y formateo HTML
│       ├── services/storage.ts  # Servicio de subida a Supabase Storage
│       ├── supabase/            # Clientes SSR para navegador, servidor y middleware
│       └── utils/               # Utilidades de Chile (RUT, CLP, Teléfonos), fechas y CSV
└── supabase/
    ├── migrations/              # Migraciones versionadas en PostgreSQL
    └── seed.sql                 # Datos de demostración (Salón Glamour Providencia)
```

---

## 🛠️ Instalación y Ejecución Local

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/tu-usuario/reservapp.git
cd reservapp
npm install
```

### 2. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-de-supabase

# URL de la Aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend (Envío de Correos Automáticos)
RESEND_API_KEY=re_1234567890abcdef
RESEND_FROM_EMAIL=notificaciones@reservapp.cl

# Secreto para el Endpoint de Cron
CRON_SECRET=tu_secreto_super_seguro_aqui
```

> [!NOTE]
> Si no cuentas con una clave real de Resend para desarrollo local, el sistema activa automáticamente el **modo simulación**, registrando los correos en la consola y en la tabla `notifications_log` sin interrumpir el flujo.

### 3. Aplicar Migraciones en Supabase
En el panel de tu proyecto de Supabase (SQL Editor), ejecuta en orden los archivos de `supabase/migrations/`:
1. `20261019000001_initial_schema.sql` (Esquema multi-tenant, 27 tablas y RLS).
2. `20261019000002_availability_function.sql` (Función RPC `get_available_slots`).
3. `20261020000001_cron_notifications.sql` (Programación con `pg_cron`).
4. `20261020000002_storage_gallery.sql` (Bucket `gallery` en Storage).
5. *(Opcional)* `supabase/seed.sql` (Datos demo para el negocio `salon-glamour`).

### 4. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con suites de verificación exhaustivas desarrolladas con TypeScript y ejecutadas mediante `tsx`:

```bash
# Ejecutar todas las pruebas del proyecto (200+ pruebas unitarias e integrales)
npm run test:stage1  # Reglas de RUT, CLP, Teléfonos y Migraciones
npm run test:stage2  # Onboarding y Reglas de reserva
npm run test:stage3  # Wizard cliente, iCalendar y Enlaces wa.me
npm run test:stage4  # Agenda, comisiones en CLP y fichas médicas
npm run test:stage5  # Resend, plantillas y ventanas horarias de Cron
npm run test:stage6  # Dashboard financiero, inventario y CSV con BOM
npm run test:stage7  # Reseñas únicas, Storage y Schema.org JSON-LD
npm run test:stage8  # Auditoría integral e2e, Seguridad y PWA
```

---

## ☁️ Guía de Despliegue en Vercel

1. **Subir cambios a GitHub:** Asegúrate de que tu rama `main` esté limpia y sincronizada.
2. **Importar en Vercel:**
   - Conecta tu cuenta de GitHub en [Vercel](https://vercel.com/) y selecciona el repositorio `reservapp`.
   - Vercel detectará automáticamente **Next.js**.
3. **Configurar Variables de Entorno en Vercel:**
   - Agrega las variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CRON_SECRET` y `NEXT_PUBLIC_APP_URL` (la URL de tu dominio en Vercel).
4. **Desplegar:** Haz clic en **Deploy**. El build compilará de forma optimizada con Turbopack.
5. **Configurar Cron de Recordatorios:**
   - En Vercel Cron o mediante la extensión `pg_cron` de Supabase, apunta a `https://tu-dominio.vercel.app/api/cron/reminders` pasando la cabecera `Authorization: Bearer <CRON_SECRET>` para disparar los recordatorios cada 15 minutos.

---

## 📖 Guía Rápida para Dueños de Negocio

1. **Registro:** Entra a `/register` y crea la cuenta del dueño del local.
2. **Onboarding:** Completa el nombre del local, comuna, dirección, teléfono de WhatsApp y el slug único (ej. `mi-salon`).
3. **Servicios y Profesionales:** En `/admin/settings`, agrega los servicios con sus variantes (duración y precio) e invita a tus estilistas asignando su % de comisión.
4. **Horarios:** Define los turnos semanales de cada profesional y los horarios de colación.
5. **Operación Diaria:**
   - Revisa tu **Agenda** en `/admin/calendar`.
   - Si un cliente llama por teléfono, agrégalo directamente con el botón **"Nueva Cita"**.
   - En `/admin/notifications`, revisa los recordatorios listos para WhatsApp de hoy y mañana y haz clic en **"Enviar WhatsApp"** para contactar a tus clientes con un clic.
   - En `/admin/commissions`, liquida y descarga el reporte mensual de comisiones en Excel.
   - En `/admin/inventory`, lleva el conteo de tinturas, cremas y productos de reventa.

---

© 2026 RESERVAPP Chile. Todos los derechos reservados.
