import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RESERVAPP - Agendamiento de Citas para Belleza en Chile",
  description:
    "Software SaaS de agendamiento de citas online para peluquerías, salones de belleza, barberías, manicuristas y spas en Chile.",
  applicationName: "RESERVAPP",
  authors: [{ name: "RESERVAPP Chile" }],
  generator: "Next.js",
  keywords: [
    "agendamiento citas chile",
    "reservar hora peluqueria",
    "software peluquerias chile",
    "manicure santiago",
    "barberia citas online",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: "https://reservapp.cl",
    title: "RESERVAPP - Agendamiento de Citas para Locales de Belleza",
    description:
      "Gestiona tu salón de belleza, recibe reservas de tus clientes sin cuenta y automatiza recordatorios por correo y WhatsApp.",
    siteName: "RESERVAPP",
  },
  twitter: {
    card: "summary_large_image",
    title: "RESERVAPP - Software de Agendamiento en Chile",
    description: "SaaS de agendamiento online para negocios de belleza y bienestar en Chile.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es-CL"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}

        {/* Registro del Service Worker para PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('Fallo registro ServiceWorker:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
