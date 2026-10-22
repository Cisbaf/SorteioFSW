"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import { dentroDoLimite, ipDoCliente } from "@/lib/protecao";
import { encerrarSessao, iniciarSessao, tokenAdmin } from "@/lib/sessao";

export type EstadoLogin = { erro?: string };

export async function entrar(_anterior: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  if (!dentroDoLimite(`login:${await ipDoCliente()}`, 10, 15 * 60_000)) {
    return { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }

  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return { erro: "Informe usuário e senha." };
  }

  const resposta = await backend("/api/auth/login", { method: "POST", body: { username: username.trim(), password } });
  if (resposta.status === 400 || resposta.status === 401) return { erro: "Usuário ou senha inválidos." };
  if (!resposta.ok) return { erro: "Não foi possível entrar agora. Tente novamente em instantes." };

  const { token, expiresIn } = (await resposta.json()) as { token: string; expiresIn: number };
  await iniciarSessao(token, expiresIn);
  redirect("/admin");
}

export async function sair() {
  await encerrarSessao();
  redirect("/admin/login");
}

export type ResultadoExclusao = { ok: true } | { ok: false; erro: string };

export async function excluirParticipante(id: number): Promise<ResultadoExclusao> {
  // Cada action é um endpoint público: a sessão é conferida aqui, não só na renderização da página.
  const token = await tokenAdmin();
  if (!token) redirect("/admin/login");
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, erro: "Participante inválido." };

  const resposta = await backend(`/participante/${id}`, { method: "DELETE", token });
  if (resposta.status === 401 || resposta.status === 403) {
    await encerrarSessao();
    redirect("/admin/login?expirada=1");
  }
  if (!resposta.ok) return { ok: false, erro: "Não foi possível excluir. Tente novamente." };

  revalidatePath("/admin");
  return { ok: true };
}
