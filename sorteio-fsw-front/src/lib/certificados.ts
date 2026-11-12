// Contrato com o backend (EnvioCertificadosService.Status). Sem "server-only": o painel também usa estes tipos.

export type EstadoEnvio = "PARADO" | "ENVIANDO" | "CONCLUIDO" | "INTERROMPIDO" | "PAUSADO_LIMITE" | "PAUSADO_ERRO";

export type StatusEnvio = {
  emailConfigurado: boolean;
  estado: EstadoEnvio;
  mensagem: string | null;
  enviandoPara: string | null;
  enviadosNestaRodada: number;
  falhasNestaRodada: number;
  /** Quem ainda vai receber no envio geral (não recebeu e não foi tirado). */
  semCertificado: number;
  /** Quem não recebeu e foi tirado do envio geral pelo admin. */
  foraDoEnvioGeral: number;
  comCertificado: number;
  enviadosUltimas24h: number;
  limite24h: number;
  intervaloSegundos: number;
};

export type ResultadoEnvio = { ok: true; status?: StatusEnvio } | { ok: false; erro: string; status?: StatusEnvio };
