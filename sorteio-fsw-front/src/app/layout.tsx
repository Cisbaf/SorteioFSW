import type { Metadata, Viewport } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { connection } from "next/server";
import { CISBAF, EVENTO } from "@/lib/evento";
import "./globals.css";

// Montserrat e Open Sans são as fontes do site do CISBAF; o next/font serve os arquivos pelo próprio domínio.
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });

const titulo = `Sorteio ${CISBAF.sigla} na ${EVENTO.hashtag}`;
const descricao = `Participe do sorteio do ${CISBAF.sigla} na ${EVENTO.nome} · ${EVENTO.cidade}, ${EVENTO.datas}.`;

export const metadata: Metadata = {
  title: { default: titulo, template: `%s · ${titulo}` },
  description: descricao,
  openGraph: { title: titulo, description: descricao, locale: "pt_BR", type: "website" },
  formatDetection: { telephone: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#0f0f33",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A CSP usa um nonce por requisição (src/proxy.ts), então nenhuma página pode ser pré-renderizada no build.
  await connection();
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${openSans.variable} antialiased`}>
      <body className="fundo-evento min-h-dvh font-sans text-white">{children}</body>
    </html>
  );
}
