import { z } from "zod";

// Mesmos limites das colunas do backend (Participante.java), para o banco nunca recusar um dado já validado aqui.
export const LIMITES = { name: 100, email: 50, institution: 60, role: 50 } as const;

export type Campo = "name" | "phone" | "email" | "institution" | "role" | "consentimento";
export type ErrosDeCampo = Partial<Record<Campo, string>>;

export type EstadoInscricao =
  | { status: "inicial" }
  | { status: "sucesso"; primeiroNome: string }
  | { status: "erro"; mensagem: string; campos?: ErrosDeCampo };

export const inscricaoSchema = z.object({
  name: z
    .string()
    .min(1, "Informe seu nome completo.")
    .max(LIMITES.name, `Use até ${LIMITES.name} caracteres.`)
    .regex(/^[\p{L}][\p{L}'’.\- ]*$/u, "Use apenas letras no nome.")
    .refine((nome) => nome.split(" ").length >= 2, "Informe nome e sobrenome."),
  phone: z
    .string()
    .min(1, "Informe seu WhatsApp com DDD.")
    .regex(/^[1-9][0-9](?:9\d{8}|[2-9]\d{7})$/, "Telefone inválido. Use DDD + número."),
  email: z
    .string()
    .min(1, "Informe seu e-mail.")
    .max(LIMITES.email, `Use um e-mail com até ${LIMITES.email} caracteres.`)
    .pipe(z.email("E-mail inválido.")),
  institution: z
    .string()
    .min(2, "Informe sua instituição.")
    .max(LIMITES.institution, `Use até ${LIMITES.institution} caracteres.`),
  role: z
    .string()
    .min(2, "Informe seu cargo ou função.")
    .max(LIMITES.role, `Use até ${LIMITES.role} caracteres.`),
});

export type Inscricao = z.infer<typeof inscricaoSchema>;

const espacos = (valor: string) => valor.normalize("NFC").trim().replace(/\s+/g, " ");

/** Só os dígitos do telefone, sem +55 nem zero de operadora/DDD na frente. */
export function digitosTelefone(valor: string): string {
  let digitos = valor.replace(/\D/g, "");
  if (digitos.length > 11 && digitos.startsWith("55")) digitos = digitos.slice(2);
  return digitos.replace(/^0+/, "").slice(0, 11);
}

/** Máscara (21) 98765-4321 / (21) 3333-4444 enquanto a pessoa digita. */
export function formatarTelefone(valor: string): string {
  const d = digitosTelefone(valor);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  if (numero.length <= 4) return `(${ddd}) ${numero}`;
  const corte = numero.length === 9 ? 5 : 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

export function normalizarInscricao(dados: Record<Campo, unknown>): Inscricao {
  const texto = (valor: unknown) => (typeof valor === "string" ? espacos(valor) : "");
  return {
    name: texto(dados.name),
    phone: digitosTelefone(texto(dados.phone)),
    email: texto(dados.email).toLowerCase(),
    institution: texto(dados.institution),
    role: texto(dados.role),
  };
}

export function validarInscricao(dados: Inscricao) {
  const resultado = inscricaoSchema.safeParse(dados);
  if (resultado.success) return { ok: true as const, dados: resultado.data };
  const campos: ErrosDeCampo = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path[0] as Campo;
    campos[campo] ??= issue.message;
  }
  return { ok: false as const, campos };
}
