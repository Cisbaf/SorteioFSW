import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import { tokenAdmin } from "@/lib/sessao";
import Painel, { type Participante } from "./painel";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const token = await tokenAdmin();
  if (!token) redirect("/admin/login");

  const resposta = await backend("/participante", { token });
  if (resposta.status === 401 || resposta.status === 403) redirect("/admin/login?expirada=1");

  if (!resposta.ok) return <Painel participantes={[]} erroAoCarregar />;

  const dados = (await resposta.json()) as Participante[];
  // Repassa ao navegador só os campos que o painel mostra.
  const participantes = dados.map(({ id, name, phone, email, institution, role }) => ({ id, name, phone, email, institution, role }));
  return <Painel participantes={participantes} />;
}
