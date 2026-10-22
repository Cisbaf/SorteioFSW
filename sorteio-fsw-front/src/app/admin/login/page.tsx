import type { Metadata } from "next";
import { SeloCisbaf, SeloEvento } from "@/components/marcas";
import FormularioLogin from "./formulario-login";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { expirada } = await searchParams;
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <SeloCisbaf compacto />
        <SeloEvento />
      </div>
      <main className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/40">
        <div className="faixa-evento h-1.5" />
        <div className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Área do administrador</h1>
          <p className="mt-1 text-sm text-slate-500">Acesso restrito à equipe do CISBAF.</p>
          <FormularioLogin sessaoExpirada={expirada === "1"} />
        </div>
      </main>
    </div>
  );
}
