import "server-only";
import { headers } from "next/headers";

const MAX_CHAVES = 10_000;
const janelas = new Map<string, { expira: number; total: number }>();

/**
 * Limite simples por janela fixa, em memória (vale para uma instância do Next).
 * Devolve false quando a chave passou de `limite` tentativas dentro de `janelaMs`.
 */
export function dentroDoLimite(chave: string, limite: number, janelaMs: number): boolean {
  const agora = Date.now();
  const atual = janelas.get(chave);
  if (atual && atual.expira > agora) {
    atual.total += 1;
    return atual.total <= limite;
  }
  if (janelas.size >= MAX_CHAVES) liberarEspaco(agora);
  janelas.set(chave, { expira: agora + janelaMs, total: 1 });
  return true;
}

function liberarEspaco(agora: number) {
  for (const [chave, janela] of janelas) {
    if (janela.expira <= agora) janelas.delete(chave);
  }
  // Ainda cheio (muitos IPs diferentes ao mesmo tempo): descarta as entradas mais antigas.
  for (const chave of janelas.keys()) {
    if (janelas.size < MAX_CHAVES) break;
    janelas.delete(chave);
  }
}

/**
 * IP de quem fez a requisição. Em produção o Next deve ficar atrás de um proxy reverso (nginx, Caddy...)
 * que sobrescreve X-Forwarded-For; exposto direto, esse cabeçalho pode ser forjado.
 */
export async function ipDoCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
}
