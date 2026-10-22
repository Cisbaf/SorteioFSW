"use server";

import { backend } from "@/lib/backend";
import { normalizarInscricao, validarInscricao, type EstadoInscricao, type Campo } from "@/lib/inscricao";
import { dentroDoLimite, ipDoCliente } from "@/lib/protecao";

// Generoso de propósito: no evento muita gente compartilha o mesmo IP (Wi-Fi do local, 4G com CGNAT).
const LIMITE_POR_IP = 30;
const JANELA_MS = 10 * 60_000;

export async function inscrever(_anterior: EstadoInscricao, formData: FormData): Promise<EstadoInscricao> {
  // Campo invisível: gente de verdade não preenche. Robô recebe "sucesso" e não descobre que foi barrado.
  if (formData.get("_gotcha")) return { status: "sucesso", primeiroNome: "" };

  if (!dentroDoLimite(`inscricao:${await ipDoCliente()}`, LIMITE_POR_IP, JANELA_MS)) {
    return { status: "erro", mensagem: "Muitas inscrições seguidas a partir desta rede. Aguarde alguns minutos e tente de novo." };
  }

  const campos = ["name", "phone", "email", "institution", "role"] as const;
  const dados = normalizarInscricao(Object.fromEntries(campos.map((c) => [c, formData.get(c)])) as Record<Campo, unknown>);
  const validacao = validarInscricao(dados);
  const consentiu = formData.get("consentimento") === "on";
  if (!validacao.ok || !consentiu) {
    return {
      status: "erro",
      mensagem: "Confira os campos destacados.",
      campos: {
        ...(validacao.ok ? {} : validacao.campos),
        ...(consentiu ? {} : { consentimento: "É preciso concordar para participar." }),
      },
    };
  }

  const resposta = await backend("/participante", { method: "POST", body: validacao.dados });
  if (resposta.ok) return { status: "sucesso", primeiroNome: validacao.dados.name.split(" ")[0] };
  if (resposta.status === 409) {
    return { status: "erro", mensagem: "Já existe uma inscrição com esses dados. Se foi você, já está concorrendo!" };
  }
  if (resposta.status === 400) {
    return { status: "erro", mensagem: "Não conseguimos validar seus dados. Confira os campos e tente de novo." };
  }
  console.error(`[inscricao] backend respondeu ${resposta.status}`);
  return { status: "erro", mensagem: "Não conseguimos registrar sua inscrição agora. Tente novamente em instantes." };
}
