import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import AuthProvider from "@/components/auth-provider";
import AppShell from "@/components/app-shell";
import { SidebarProvider } from "@/components/sidebar-context";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import { PWAProvider } from "@/hooks/usePWA";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "MAQUINARIA PRO - Control de Maquinaria Pesada",
  description: "Sistema de gestión y control de maquinaria pesada para el Grupo Vásquez",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAQUINARIA PRO",
  },
  formatDetection: {
    telephone: false,
  },
  keywords: ["maquinaria", "control", "mantenimiento", "SOAT", "CITV", "gestión"],
  authors: [{ name: "Grupo Vásquez" }],
  openGraph: {
    type: "website",
    title: "MAQUINARIA PRO",
    description: "Sistema de Control de Maquinaria Pesada",
    siteName: "MAQUINARIA PRO",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1E3A5F" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="MAQUINARIA PRO" />
        <meta name="apple-mobile-web-app-title" content="MAQUINARIA PRO" />
        <meta name="msapplication-TileColor" content="#1E3A5F" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
        <ThemeProvider>
          <ToastProvider>
            <PWAProvider>
              <AuthProvider>
                <ConfirmDialogProvider>
                  <SidebarProvider>
                    <AppShell>
                      {children}
                    </AppShell>
                  </SidebarProvider>
                </ConfirmDialogProvider>
              </AuthProvider>
            </PWAProvider>
          </ToastProvider>
        </ThemeProvider>

        {/* Service Worker Registration & PWA Install Prompt */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Capture PWA install prompt
              window.deferredPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.deferredPrompt = e;
                console.log('[PWA] Install prompt captured');
              });

              // Service Worker Registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[SW] Registration successful:', registration.scope);
                    })
                    .catch(function(err) {
                      console.log('[SW] Registration failed:', err);
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
