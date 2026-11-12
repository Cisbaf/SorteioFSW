"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backend } from "@/lib/backend";
import type { ResultadoEnvio, StatusEnvio } from "@/lib/certificados";
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

/** Token do admin para as actions de certificado; sessão vencida volta para o login. */
async function exigirToken() {
  const token = await tokenAdmin();
  if (!token) redirect("/admin/login");
  return token;
}

async function sessaoExpirou(resposta: Response) {
  if (resposta.status !== 401 && resposta.status !== 403) return;
  await encerrarSessao();
  redirect("/admin/login?expirada=1");
}

/** Mensagem que o backend manda nas recusas de envio ({ mensagem }), com um texto padrão se não vier nada. */
async function mensagemDoBackend(resposta: Response, padrao: string) {
  try {
    const corpo = (await resposta.json()) as { mensagem?: unknown };
    return typeof corpo.mensagem === "string" && corpo.mensagem ? corpo.mensagem : padrao;
  } catch {
    return padrao;
  }
}

export async function statusEnvioCertificados(): Promise<StatusEnvio | null> {
  const resposta = await backend("/participante/certificados/envio", { token: await exigirToken(), cache: "no-store" });
  await sessaoExpirou(resposta);
  return resposta.ok ? ((await resposta.json()) as StatusEnvio) : null;
}

export async function enviarCertificadosParaTodos(): Promise<ResultadoEnvio> {
  const resposta = await backend("/participante/certificados/envio", { method: "POST", token: await exigirToken() });
  await sessaoExpirou(resposta);
  if (!resposta.ok) return { ok: false, erro: await mensagemDoBackend(resposta, "Não foi possível iniciar o envio. Tente novamente.") };
  return { ok: true, status: (await resposta.json()) as StatusEnvio };
}

export async function pararEnvioCertificados(): Promise<ResultadoEnvio> {
  const resposta = await backend("/participante/certificados/envio/parar", { method: "POST", token: await exigirToken() });
  await sessaoExpirou(resposta);
  if (!resposta.ok) return { ok: false, erro: "Não foi possível parar o envio. Tente novamente." };
  return { ok: true, status: (await resposta.json()) as StatusEnvio };
}

export async function definirForaDoEnvioGeral(id: number, fora: boolean): Promise<ResultadoEnvio> {
  const token = await exigirToken();
  if (!Number.isSafeInteger(id) || id <= 0 || typeof fora !== "boolean") return { ok: false, erro: "Participante inválido." };

  const resposta = await backend(`/participante/${id}/certificado/fora-do-envio-geral`, { method: "PUT", token, body: { fora } });
  await sessaoExpirou(resposta);
  if (!resposta.ok) return { ok: false, erro: await mensagemDoBackend(resposta, "Não foi possível alterar. Tente novamente.") };
  revalidatePath("/admin");
  return { ok: true };
}

export async function enviarCertificado(id: number): Promise<ResultadoEnvio> {
  const token = await exigirToken();
  if (!Number.isSafeInteger(id) || id <= 0) return { ok: false, erro: "Participante inválido." };

  const resposta = await backend(`/participante/${id}/certificado/email`, { method: "POST", token });
  await sessaoExpirou(resposta);
  revalidatePath("/admin");
  if (!resposta.ok) return { ok: false, erro: await mensagemDoBackend(resposta, "Não foi possível enviar o certificado. Tente novamente.") };
  return { ok: true };
}
