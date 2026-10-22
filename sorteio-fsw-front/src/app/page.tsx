import { IconeCalendario, IconeLocal } from "@/components/icones";
import { MarcaFswk, SeloCisbaf, SeloEvento } from "@/components/marcas";
import { CISBAF, EVENTO } from "@/lib/evento";
import Inscricao from "./inscricao";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pt-4 pb-8 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between gap-3">
        <SeloCisbaf />
        <SeloEvento />
      </header>

      <main className="flex flex-1 flex-col gap-8 pt-8 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:pt-12">
        <section className="animar-entrada" aria-labelledby="titulo">
          <p className="inline-flex items-center gap-2 rounded-full bg-lima/15 px-3 py-1 text-xs font-bold tracking-widest text-lima uppercase">
            Sorteio exclusivo {CISBAF.sigla}
          </p>
          <h1 id="titulo" className="mt-4 font-display text-[2.15rem] leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Concorra no sorteio do {CISBAF.sigla} na <MarcaFswk className="whitespace-nowrap" />
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Leva menos de um minuto: preencha seus dados e pronto, você já está participando.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/90">
            <li className="flex items-center gap-2">
              <IconeCalendario className="size-5 text-amarelo" />
              <span>{EVENTO.datas}</span>
            </li>
            <li className="flex items-center gap-2">
              <IconeLocal className="size-5 text-rosa" />
              <span>{EVENTO.cidade}</span>
            </li>
          </ul>
        </section>

        <section className="animar-entrada [animation-delay:120ms]" aria-label="Formulário de inscrição">
          <Inscricao />
        </section>
      </main>

      <footer className="mt-10 border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-white/60 sm:text-left">
        <p>
          Realização:{" "}
          <a href={CISBAF.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white/85 underline-offset-2 hover:underline">
            {CISBAF.nome}
          </a>
        </p>
        <p className="mt-1">
          Ação durante a{" "}
          <a href={EVENTO.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white/85 underline-offset-2 hover:underline">
            {EVENTO.hashtag}
          </a>
        </p>
      </footer>
    </div>
  );
}
