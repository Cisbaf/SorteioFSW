import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import { tokenAdmin } from "@/lib/sessao";
import type { Participante } from "../painel";
import Telao from "./telao";

export const metadata: Metadata = {
  title: "Autoridades",
  robots: { index: false, follow: false },
};

export default async function AutoridadesPage() {
  const token = await tokenAdmin();
  if (!token) redirect("/admin/login");

  const resposta = await backend("/participante", { token });
  if (resposta.status === 401 || resposta.status === 403)
    redirect("/admin/login?expirada=1");

  if (!resposta.ok) return <Telao participantes={[]} erroAoCarregar />;

  const dados = (await resposta.json()) as Participante[];
  // Esta tela só mostra nome, instituição e cargo: o resto dos dados não vai para o navegador.
  const participantes = dados.map(({ id, name, institution, role }) => ({
    id,
    name,
    institution,
    role,
  }));
  return <Telao participantes={participantes} />;
}
