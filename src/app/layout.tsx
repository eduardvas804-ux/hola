import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MAQUINARIA PRO - Control de Maquinaria Pesada",
  description: "Sistema de gestión y control de maquinaria pesada para el Grupo Vásquez",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 transition-all duration-300">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
