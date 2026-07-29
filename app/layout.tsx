import type { Metadata } from "next";
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

const TITULO = "Estoque Xerox Equipe Carlos Marcelo";
const DESCRICAO = "Controle de estoque de peças e suprimentos Xerox — entradas, retiradas e rastreabilidade por unidade.";

export const metadata: Metadata = {
  // Base absoluta: WhatsApp e demais leitores de link exigem URL completa na
  // og:image. Trocar aqui se o app ganhar domínio próprio.
  metadataBase: new URL("https://xerox-estoque.benny-solucoes.workers.dev"),
  title: TITULO,
  description: DESCRICAO,
  applicationName: "Estoque Xerox",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Estoque Xerox", statusBarStyle: "black-translucent" },
  other: {
    "codex-preview": "development",
    // Meta tag crua: independe do suporte do framework ao export `viewport`.
    // `mobile-web-app-capable` não entra aqui — `appleWebApp` já a emite.
    "theme-color": "#D71920",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Estoque Xerox",
    title: TITULO,
    description: DESCRICAO,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Estoque Xerox" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRICAO,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
