"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  IconeAlerta,
  IconeAtualizar,
  IconeBusca,
  IconeDownload,
  IconeLixeira,
  IconeSair,
  IconeSorteio,
  IconeWhatsApp,
} from "@/components/icones";
import { MarcaFswk, SeloCisbaf } from "@/components/marcas";
import { digitosTelefone, formatarTelefone } from "@/lib/inscricao";
import { excluirParticipante, sair } from "./actions";

export type Participante = {
  id: number;
  name: string;
  phone: string;
  email: string;
  institution: string;
  role: string;
};

/** Índice uniforme em [0, max) com o gerador criptográfico do navegador (sem o viés do módulo). */
function indiceAleatorio(max: number) {
  const limite = Math.floor(0x1_0000_0000 / max) * max;
  const sorteado = new Uint32Array(1);
  do {
    crypto.getRandomValues(sorteado);
  } while (sorteado[0] >= limite);
  return sorteado[0] % max;
}

const linkWhatsApp = (telefone: string) => `https://wa.me/55${digitosTelefone(telefone)}`;

export default function Painel({ participantes, erroAoCarregar = false }: { participantes: Participante[]; erroAoCarregar?: boolean }) {
  const router = useRouter();
  const [atualizando, iniciarAtualizacao] = useTransition();
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<number | null>(null);

  const termo = busca.trim().toLowerCase();
  const visiveis = [...participantes]
    .sort((a, b) => b.id - a.id)
    .filter((p) => !termo || [p.name, p.email, p.institution, p.role, p.phone].some((v) => v.toLowerCase().includes(termo)));

  async function excluir(p: Participante) {
    if (!window.confirm(`Excluir a inscrição de ${p.name}? Essa ação não pode ser desfeita.`)) return;
    setErro(null);
    setExcluindo(p.id);
    const resultado = await excluirParticipante(p.id);
    setExcluindo(null);
    if (!resultado.ok) setErro(resultado.erro);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SeloCisbaf compacto />
          <div>
            <h1 className="font-display text-lg leading-tight font-extrabold sm:text-xl">Painel do sorteio</h1>
            <p className="text-xs text-white/60">
              <MarcaFswk className="text-sm" /> <span className="text-lima">26</span> · área restrita
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => iniciarAtualizacao(() => router.refresh())}
            disabled={atualizando}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15 disabled:opacity-60"
          >
            <IconeAtualizar className={`size-4 ${atualizando ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          {participantes.length > 0 && (
            // Link comum (não <Link>): é um download, não uma navegação, e não deve ser pré-carregado.
            <a
              href="/admin/excel"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-lima px-4 text-sm font-bold text-noite-950 transition hover:brightness-95"
            >
              <IconeDownload className="size-4" />
              <span>Baixar Excel</span>
            </a>
          )}
          <form action={sair}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold transition hover:bg-white/15"
            >
              <IconeSair className="size-4" />
              Sair
            </button>
          </form>
        </div>
      </header>

      {(erroAoCarregar || erro) && (
        <div role="alert" className="mt-5 flex gap-2 rounded-2xl border border-red-300/40 bg-red-500/15 p-3 text-sm font-medium text-red-100">
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
          <p>{erro ?? "Não foi possível carregar os inscritos. Confira se o backend está no ar e clique em Atualizar."}</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_1.6fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm font-semibold text-white/70">Inscritos</p>
          <p className="mt-1 font-display text-5xl font-black tracking-tight">{participantes.length}</p>
          <p className="mt-2 text-xs text-white/50">Atualize para ver as inscrições mais recentes.</p>
        </section>
        <Sorteio participantes={participantes} />
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/30" aria-labelledby="titulo-lista">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <h2 id="titulo-lista" className="font-display text-lg font-extrabold">
            Participantes
          </h2>
          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar participante</span>
            <IconeBusca className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail, instituição..."
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pr-4 pl-10 text-base outline-none focus:border-magenta focus:ring-4 focus:ring-magenta/15 sm:text-sm"
            />
          </label>
        </div>

        {visiveis.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {participantes.length === 0 ? "Ainda não há inscrições." : "Nenhum participante encontrado."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visiveis.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{p.name}</p>
                  <p className="text-sm break-words text-slate-600">
                    {p.institution} · {p.role}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                    <span>{formatarTelefone(p.phone)}</span>
                    <span className="break-all">{p.email}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <a
                    href={linkWhatsApp(p.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-10 place-items-center rounded-full text-emerald-600 transition hover:bg-emerald-50"
                    aria-label={`Abrir WhatsApp de ${p.name}`}
                  >
                    <IconeWhatsApp className="size-5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => excluir(p)}
                    disabled={excluindo === p.id}
                    className="grid size-10 place-items-center rounded-full text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    aria-label={`Excluir inscrição de ${p.name}`}
                  >
                    {excluindo === p.id ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" aria-hidden="true" />
                    ) : (
                      <IconeLixeira className="size-5" />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Sorteio({ participantes }: { participantes: Participante[] }) {
  const [sorteados, setSorteados] = useState<Participante[]>([]);
  const [rolando, setRolando] = useState<Participante | null>(null);
  const intervalo = useRef<ReturnType<typeof setInterval>>(undefined);
  useEffect(() => () => clearInterval(intervalo.current), []);

  const jaSorteados = new Set(sorteados.map((p) => p.id));
  const disponiveis = participantes.filter((p) => !jaSorteados.has(p.id));
  const ganhador = sorteados[0];
  const sorteando = rolando !== null;

  function sortear() {
    if (disponiveis.length === 0 || sorteando) return;
    const escolhido = disponiveis[indiceAleatorio(disponiveis.length)];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSorteados((s) => [escolhido, ...s]);
      return;
    }
    // Só efeito visual: o ganhador já foi escolhido acima.
    const inicio = Date.now();
    intervalo.current = setInterval(() => {
      if (Date.now() - inicio >= 1800) {
        clearInterval(intervalo.current);
        setRolando(null);
        setSorteados((s) => [escolhido, ...s]);
        return;
      }
      setRolando(disponiveis[Math.floor(Math.random() * disponiveis.length)]);
    }, 80);
    setRolando(disponiveis[0]);
  }

  return (
    <section className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/30" aria-labelledby="titulo-sorteio">
      <div className="faixa-evento h-1.5" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-sorteio" className="font-display text-lg font-extrabold">
            Sorteio
          </h2>
          <button
            type="button"
            onClick={sortear}
            disabled={disponiveis.length === 0 || sorteando}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-magenta px-5 font-display text-sm font-bold text-white shadow-lg shadow-magenta/30 transition hover:bg-magenta-escuro disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconeSorteio className="size-5" />
            {sorteados.length ? "Sortear outro" : "Sortear ganhador"}
          </button>
        </div>

        <div className="mt-4 min-h-28 rounded-2xl bg-noite-900 p-4 text-white" aria-live="polite">
          {sorteando ? (
            <p className="font-display text-2xl font-extrabold break-words text-white/80">{rolando.name}</p>
          ) : ganhador ? (
            <div className="animar-entrada">
              <p className="text-xs font-bold tracking-widest text-lima uppercase">
                {sorteados.length === 1 ? "Ganhador(a)" : `${sorteados.length}º sorteado(a)`}
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold break-words">{ganhador.name}</p>
              <p className="text-sm text-white/70">
                {ganhador.institution} · {ganhador.role}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <a
                  href={linkWhatsApp(ganhador.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold hover:bg-white/15"
                >
                  <IconeWhatsApp className="size-4" />
                  {formatarTelefone(ganhador.phone)}
                </a>
                <a href={`mailto:${ganhador.email}`} className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 font-semibold break-all hover:bg-white/15">
                  {ganhador.email}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60">
              {participantes.length === 0
                ? "Assim que houver inscrições, o sorteio fica disponível."
                : `Clique em "Sortear ganhador" para escolher entre ${participantes.length} inscrito(s).`}
            </p>
          )}
        </div>

        {sorteados.length > 1 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500">Sorteados antes nesta sessão</p>
            <ol className="mt-1 space-y-0.5 text-sm text-slate-700">
              {sorteados.slice(1).map((p, i) => (
                <li key={p.id}>
                  {sorteados.length - 1 - i}º · {p.name}
                </li>
              ))}
            </ol>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          O sorteio usa o gerador criptográfico do navegador e não repete quem já saiu nesta sessão. Ao recarregar a página, o
          histórico do sorteio é zerado.
        </p>
      </div>
    </section>
  );
}
