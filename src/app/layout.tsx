import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAQUINARIA PRO - Control de Maquinaria Pesada",
  description: "Sistema de gestión y control de maquinaria pesada para el Grupo Vásquez",
};

import AuthProvider from "@/components/auth-provider";
import AppShell from "@/components/app-shell";
import { SidebarProvider } from "@/components/sidebar-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            <AppShell>
              {children}
            </AppShell>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
