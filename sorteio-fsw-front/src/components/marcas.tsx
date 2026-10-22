import { CISBAF, EVENTO } from "@/lib/evento";

/** Logo do CISBAF numa pílula branca, que mantém o contraste sobre o fundo escuro. */
export function SeloCisbaf({ compacto = false }: { compacto?: boolean }) {
  return (
    <a
      href={CISBAF.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-white py-1.5 pr-4 pl-1.5 shadow-lg shadow-black/20 transition hover:scale-[1.02]"
      aria-label={`${CISBAF.sigla} - ${CISBAF.nome} (abre em nova aba)`}
    >
      {/* <img> comum: o next/image põe style="color:transparent" na tag, e a CSP sem 'unsafe-inline' bloqueia. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/cisbaf.png" alt="" width={103} height={96} className="h-8 w-auto" />
      {!compacto && (
        <span className="font-display text-[11px] leading-tight font-semibold text-slate-600">
          Consórcio de Saúde da
          <span className="block font-bold text-cisbaf-azul">Baixada Fluminense</span>
        </span>
      )}
    </a>
  );
}

const LETRAS = [
  { letra: "f", cor: "text-rosa" },
  { letra: "s", cor: "text-laranja" },
  { letra: "w", cor: "text-lima" },
  { letra: "k", cor: "text-lilas" },
  { letra: ".", cor: "text-amarelo" },
];

/** Assinatura "fswk." nas cores do evento. */
export function MarcaFswk({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-black tracking-tighter lowercase ${className}`} aria-label="fswk">
      {LETRAS.map(({ letra, cor }) => (
        <span key={letra} className={cor} aria-hidden="true">
          {letra}
        </span>
      ))}
    </span>
  );
}

export function SeloEvento() {
  return (
    <a
      href={EVENTO.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
      aria-label={`${EVENTO.hashtag} - página do evento (abre em nova aba)`}
    >
      <MarcaFswk className="text-lg leading-none" />
      <span className="text-lima">26</span>
    </a>
  );
}
