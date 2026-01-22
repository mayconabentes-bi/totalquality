import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TotalQuality - Módulo de Gestão de Documentação",
  description: "Sistema de Gestão de Qualidade (SGQ) baseado nos 4 Cs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
