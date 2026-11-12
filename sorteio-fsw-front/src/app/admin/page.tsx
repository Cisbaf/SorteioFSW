import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import { tokenAdmin } from "@/lib/sessao";
import type { StatusEnvio } from "@/lib/certificados";
import Painel, { type Participante } from "./painel";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = await tokenAdmin();
  if (!token) redirect("/admin/login");

  const [resposta, respostaEnvio] = await Promise.all([
    backend("/participante", { token }),
    backend("/participante/certificados/envio", { token }),
  ]);
  if (resposta.status === 401 || resposta.status === 403) redirect("/admin/login?expirada=1");
  const statusEnvio = respostaEnvio.ok ? ((await respostaEnvio.json()) as StatusEnvio) : null;

  if (!resposta.ok) return <Painel participantes={[]} statusEnvio={statusEnvio} erroAoCarregar />;

  const dados = (await resposta.json()) as Participante[];
  // Repassa ao navegador só os campos que o painel mostra.
  const participantes = dados.map(({ id, name, phone, email, institution, role, certificadoEnviadoEm, certificadoErro, foraDoEnvioGeral }) => ({
    id,
    name,
    phone,
    email,
    institution,
    role,
    certificadoEnviadoEm,
    certificadoErro,
    foraDoEnvioGeral,
  }));
  return <Painel participantes={participantes} statusEnvio={statusEnvio} />;
}
