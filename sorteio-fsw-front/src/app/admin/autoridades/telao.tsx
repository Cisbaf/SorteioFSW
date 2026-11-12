"use client";

import { IconeAlerta } from "@/components/icones";
import { MarcaFswk, SeloCisbaf } from "@/components/marcas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

export type ParticipanteResumo = {
  id: number;
  name: string;
  institution: string;
  role: string;
};

const INTERVALO_MS = 3000;

// Mesmas opções do formulário de inscrição (menos "Outros cargos").
const AUTORIDADES = [
  "Secretário municipal",
  "Secretário executivo",
  "Prefeito",
  "Vice-prefeito",
  "Deputado",
];

/** Compara sem acento, caixa ou hífen, para pegar também quem digitou o cargo à mão (ex.: "vice prefeito"). */
const chave = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-\s]+/g, " ")
    .trim();

const CHAVES_AUTORIDADES = new Map(
  AUTORIDADES.map((cargo) => [chave(cargo), cargo]),
);

export default function Telao({
  participantes,
  erroAoCarregar = false,
}: {
  participantes: ParticipanteResumo[];
  erroAoCarregar?: boolean;
}) {
  const router = useRouter();
  const [atualizando, iniciarAtualizacao] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) iniciarAtualizacao(() => router.refresh());
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [router]);

  // O id cresce a cada inscrição: maior id = inscrição mais recente.
  const recentes = [...participantes].sort((a, b) => b.id - a.id);
  const autoridades = recentes.filter((p) =>
    CHAVES_AUTORIDADES.has(chave(p.role)),
  );
  const demais = recentes.filter((p) => !CHAVES_AUTORIDADES.has(chave(p.role)));
  const [maisNova, ...outrasAutoridades] = autoridades;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SeloCisbaf compacto />
          <div>
            <h1 className="font-display text-lg leading-tight font-extrabold sm:text-xl">
              Participantes
            </h1>
            <p className="text-xs text-white/60">
              <MarcaFswk className="text-sm" />{" "}
              <span className="text-lima">26</span> · {participantes.length}{" "}
              inscrito(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 text-xs text-white/60"
            aria-live="off"
          >
            <span
              className={`size-2 rounded-full bg-lima ${atualizando ? "animate-ping" : ""}`}
              aria-hidden="true"
            />
            Atualiza a cada 3 s
          </span>
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15"
          >
            Painel
          </Link>
        </div>
      </header>

      {erroAoCarregar && (
        <div
          role="alert"
          className="mt-5 flex gap-2 rounded-2xl border border-red-300/40 bg-red-500/15 p-3 text-sm font-medium text-red-100"
        >
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
          <p>
            Não foi possível carregar os inscritos. Tentando de novo
            automaticamente...
          </p>
        </div>
      )}

      <section className="mt-5" aria-labelledby="titulo-autoridades">
        <h2
          id="titulo-autoridades"
          className="text-xs font-bold tracking-widest text-white/60 uppercase"
        >
          Todos os participantes · {participantes.length}
          <span className="ml-2 text-lima">
            ({autoridades.length} autoridade(s) no topo)
          </span>
        </h2>

        {participantes.length === 0 ? (
          <p className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
            Ainda não há inscrições.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {/* key = id: quem acabou de chegar monta do zero e entra com animação no topo. */}
            {maisNova && (
              <li
                key={maisNova.id}
                className="animar-entrada relative overflow-hidden rounded-3xl bg-linear-to-r from-magenta to-laranja p-5 shadow-2xl shadow-magenta/40 ring-4 ring-lima sm:p-6"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-lima px-3 py-1 text-xs font-black tracking-widest text-noite-950 uppercase">
                  <span
                    className="size-2 animate-pulse rounded-full bg-noite-950"
                    aria-hidden="true"
                  />
                  Novo
                </span>
                <p className="mt-2 font-display text-3xl leading-tight font-black break-words sm:text-5xl">
                  {maisNova.name}
                </p>
                <p className="mt-1 text-base font-semibold text-white/90 sm:text-lg">
                  {CHAVES_AUTORIDADES.get(chave(maisNova.role))} ·{" "}
                  {maisNova.institution}
                </p>
              </li>
            )}
            {outrasAutoridades.map((p) => (
              <li
                key={p.id}
                className="animar-entrada flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border-l-8 border-amarelo bg-white px-5 py-4 text-slate-900 shadow-lg shadow-black/20"
              >
                <div className="min-w-0">
                  <p className="font-display text-xl font-extrabold break-words sm:text-2xl">
                    {p.name}
                  </p>
                  <p className="text-sm break-words text-slate-600">
                    {p.institution}
                  </p>
                </div>
                <p className="rounded-full bg-amarelo/30 px-3 py-0.5 text-sm font-bold text-slate-800">
                  {CHAVES_AUTORIDADES.get(chave(p.role))}
                </p>
              </li>
            ))}
            {demais.map((p) => (
              <li
                key={p.id}
                className="animar-entrada flex flex-wrap items-baseline justify-between gap-x-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 break-words"
              >
                <span className="text-lg font-semibold text-white/90">
                  {p.name}
                </span>
                <span className="text-sm text-white/60">{p.institution}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
