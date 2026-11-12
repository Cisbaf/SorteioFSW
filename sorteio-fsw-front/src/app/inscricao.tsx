"use client";

import { IconeAlerta, IconeCadeado, IconeCheck, IconeSeta } from "@/components/icones";
import {
  LIMITES,
  digitosTelefone,
  formatarTelefone,
  normalizarInscricao,
  validarInscricao,
  type Campo,
  type ErrosDeCampo,
  type EstadoInscricao,
} from "@/lib/inscricao";
import { startTransition, useActionState, useEffect, useRef, useState, type ComponentProps, type FormEvent } from "react";
import { inscrever } from "./actions";

const VAZIO = { name: "", phone: "", email: "", institution: "", role: "" };
const CAMPOS: Campo[] = ["name", "phone", "email", "institution", "role", "consentimento"];

const OUTROS = "Outros cargos";
const CARGOS = ["Secretário municipal", "Secretário executivo", "Prefeito", "Vice-prefeito", "Deputado", OUTROS];
const CLASSE_CAMPO =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 transition outline-none placeholder:text-slate-400 focus:border-magenta focus:ring-4 focus:ring-magenta/15 aria-invalid:border-red-500 aria-invalid:focus:ring-red-500/15";

export default function Inscricao() {
  // Trocar a key remonta o formulário do zero: útil quando o celular/tablet é usado no estande para várias pessoas.
  const [rodada, setRodada] = useState(0);
  return (
    <div className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-black/40">
      <div className="faixa-evento h-1.5" />
      <Formulario key={rodada} onNovaInscricao={() => setRodada((r) => r + 1)} />
    </div>
  );
}

function Formulario({ onNovaInscricao }: { onNovaInscricao: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoInscricao, FormData>(inscrever, { status: "inicial" });
  const [valores, setValores] = useState(VAZIO);
  const [consentiu, setConsentiu] = useState(false);
  // Opção escolhida no select; em "Outros cargos" o texto digitado fica em `valores.role`.
  const [cargo, setCargo] = useState("");
  // Erros da validação local; `undefined` explícito esconde o erro do servidor depois que a pessoa corrige o campo.
  const [errosLocais, setErrosLocais] = useState<ErrosDeCampo>({});
  const [mensagemLocal, setMensagemLocal] = useState<string | null>(null);

  if (estado.status === "sucesso") return <Sucesso primeiroNome={estado.primeiroNome} onNovaInscricao={onNovaInscricao} />;

  const erros: ErrosDeCampo = { ...(estado.status === "erro" ? estado.campos : {}), ...errosLocais };
  const mensagem = enviando ? null : (mensagemLocal ?? (estado.status === "erro" ? estado.mensagem : null));

  function alterar(campo: keyof typeof VAZIO, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrosLocais((e) => ({ ...e, [campo]: undefined }));
  }

  function alterarTelefone(valor: string) {
    // Apagar só a pontuação da máscara não muda os dígitos; nesse caso apaga o último dígito.
    const apagou = valor.length < valores.phone.length && digitosTelefone(valor) === digitosTelefone(valores.phone);
    alterar("phone", formatarTelefone(apagou ? digitosTelefone(valor).slice(0, -1) : valor));
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    // Com JavaScript, o envio é manual: o `action` do form faria o React resetar o formulário depois da resposta
    // (desmarcando o consentimento num erro). Sem JavaScript, o `action` continua funcionando sozinho.
    evento.preventDefault();
    const role = cargo === OUTROS ? valores.role : cargo;
    const validacao = validarInscricao(normalizarInscricao({ ...valores, role, consentimento: consentiu }));
    const encontrados: ErrosDeCampo = validacao.ok ? {} : { ...validacao.campos };
    if (!cargo) encontrados.role = "Selecione seu cargo.";
    if (!consentiu) encontrados.consentimento = "É preciso concordar para participar.";

    const primeiroInvalido = CAMPOS.find((c) => encontrados[c]);
    if (primeiroInvalido) {
      setErrosLocais(Object.fromEntries(CAMPOS.map((c) => [c, encontrados[c]])));
      setMensagemLocal("Confira os campos destacados.");
      const idFoco = primeiroInvalido === "role" && cargo === OUTROS ? "role-outro" : primeiroInvalido;
      document.getElementById(idFoco)?.focus();
      return;
    }
    setErrosLocais({});
    setMensagemLocal(null);
    const dados = new FormData(evento.currentTarget);
    startTransition(() => acao(dados));
  }

  return (
    <form action={acao} onSubmit={enviar} noValidate className="p-5 sm:p-8">
      <h2 className="font-display text-xl font-extrabold tracking-tight sm:text-2xl">Faça sua inscrição</h2>
      <p className="mt-1 text-sm text-slate-500">Todos os campos são obrigatórios.</p>

      {mensagem && (
        <div role="alert" className="mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
          <p>{mensagem}</p>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <CampoTexto
          id="name"
          rotulo="Nome completo"
          erro={erros.name}
          value={valores.name}
          onChange={(e) => alterar("name", e.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          maxLength={LIMITES.name}
          enterKeyHint="next"
        />
        <CampoTexto
          id="phone"
          rotulo="WhatsApp"
          dica="Com DDD, para avisarmos se você for sorteado(a)."
          erro={erros.phone}
          value={valores.phone}
          onChange={(e) => alterarTelefone(e.target.value)}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="(21) 98765-4321"
          maxLength={15}
          enterKeyHint="next"
        />
        <CampoTexto
          id="email"
          rotulo="E-mail"
          erro={erros.email}
          value={valores.email}
          onChange={(e) => alterar("email", e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="voce@exemplo.com"
          maxLength={LIMITES.email}
          enterKeyHint="next"
        />
        <CampoTexto
          id="institution"
          rotulo="Instituição"
          dica="Onde você trabalha ou estuda."
          erro={erros.institution}
          value={valores.institution}
          onChange={(e) => alterar("institution", e.target.value)}
          autoComplete="organization"
          maxLength={LIMITES.institution}
          enterKeyHint="next"
        />
        <CampoCargo
          cargo={cargo}
          outro={valores.role}
          erro={erros.role}
          onCargo={(valor) => {
            setCargo(valor);
            alterar("role", "");
          }}
          onOutro={(valor) => alterar("role", valor)}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-snug text-slate-700 has-checked:border-magenta/40 has-checked:bg-magenta/5">
            <input
              id="consentimento"
              name="consentimento"
              type="checkbox"
              checked={consentiu}
              onChange={(e) => {
                setConsentiu(e.target.checked);
                setErrosLocais((v) => ({ ...v, consentimento: undefined }));
              }}
              aria-invalid={Boolean(erros.consentimento)}
              aria-describedby={erros.consentimento ? "consentimento-erro" : undefined}
              className="mt-0.5 size-5 shrink-0 accent-magenta"
            />
            <span>
              Concordo que o CISBAF use meus dados <strong>somente para este sorteio</strong> e para entrar em contato caso eu
              seja sorteado(a).
            </span>
          </label>
          {erros.consentimento && <MensagemErro id="consentimento-erro">{erros.consentimento}</MensagemErro>}
        </div>
      </div>

      {/* Armadilha para robôs: fora da tela e fora da navegação por teclado. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Deixe em branco
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-magenta px-6 font-display text-base font-bold text-white shadow-lg shadow-magenta/30 transition hover:bg-magenta-escuro focus-visible:ring-4 focus-visible:ring-magenta/30 focus-visible:outline-none active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 hover:cursor-pointer"
      >
        {enviando ? (
          <>
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            Quero participar
            <IconeSeta className="size-5" />
          </>
        )}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <IconeCadeado className="size-4" />
        Usamos seus dados somente para este sorteio.
      </p>
    </form>
  );
}

type CampoTextoProps = Omit<ComponentProps<"input">, "id" | "name"> & {
  id: keyof typeof VAZIO;
  rotulo: string;
  dica?: string;
  erro?: string;
};

function CampoTexto({ id, rotulo, dica, erro, ...input }: CampoTextoProps) {
  const descricao = erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800">
        {rotulo}
      </label>
      <input
        id={id}
        name={id}
        required
        aria-invalid={Boolean(erro)}
        aria-describedby={descricao}
        className={CLASSE_CAMPO}
        {...input}
      />
      {erro ? (
        <MensagemErro id={`${id}-erro`}>{erro}</MensagemErro>
      ) : (
        dica && (
          <p id={`${id}-dica`} className="mt-1.5 text-xs text-slate-500">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

type CampoCargoProps = {
  cargo: string;
  outro: string;
  erro?: string;
  onCargo: (valor: string) => void;
  onOutro: (valor: string) => void;
};

function CampoCargo({ cargo, outro, erro, onCargo, onOutro }: CampoCargoProps) {
  const ehOutro = cargo === OUTROS;
  return (
    <div>
      <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-slate-800">
        Cargo
      </label>
      <select
        id="role"
        // O servidor lê `role`: em "Outros cargos" quem envia o valor é a caixa de texto.
        name={ehOutro ? undefined : "role"}
        required
        value={cargo}
        onChange={(e) => onCargo(e.target.value)}
        aria-invalid={Boolean(erro) && !ehOutro}
        aria-describedby={erro && !ehOutro ? "role-erro" : undefined}
        className={`${CLASSE_CAMPO} cursor-pointer ${cargo ? "" : "text-slate-400"}`}
      >
        <option value="" disabled>
          Selecione seu cargo
        </option>
        {CARGOS.map((c) => (
          <option key={c} value={c} className="text-slate-900">
            {c}
          </option>
        ))}
      </select>
      {ehOutro && (
        <>
          <label htmlFor="role-outro" className="sr-only">
            Qual é o seu cargo?
          </label>
          <input
            id="role-outro"
            name="role"
            required
            autoFocus
            value={outro}
            onChange={(e) => onOutro(e.target.value)}
            placeholder="Digite seu cargo"
            autoComplete="organization-title"
            maxLength={LIMITES.role}
            enterKeyHint="done"
            aria-invalid={Boolean(erro)}
            aria-describedby={erro ? "role-erro" : undefined}
            className={`${CLASSE_CAMPO} mt-2`}
          />
        </>
      )}
      {erro && <MensagemErro id="role-erro">{erro}</MensagemErro>}
    </div>
  );
}

function MensagemErro({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-red-600">
      <IconeAlerta className="size-4 shrink-0" />
      {children}
    </p>
  );
}

function Sucesso({ primeiroNome, onNovaInscricao }: { primeiroNome: string; onNovaInscricao: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => titulo.current?.focus(), []);

  return (
    <div className="animar-entrada px-5 py-10 text-center sm:px-8 sm:py-14" aria-live="polite">
      <div className="relative mx-auto size-24">
        <span className="absolute top-0 left-1 size-3 rounded-full bg-rosa" />
        <span className="absolute top-3 right-0 size-2.5 rounded-full bg-lima" />
        <span className="absolute bottom-1 left-0 size-2 rounded-full bg-amarelo" />
        <span className="absolute right-2 bottom-0 size-3 rounded-full bg-lilas" />
        <div className="absolute inset-3 grid place-items-center rounded-full bg-linear-to-br from-magenta to-laranja text-white shadow-lg shadow-magenta/30">
          <IconeCheck className="size-9" strokeWidth={3} />
        </div>
      </div>
      <h2 ref={titulo} tabIndex={-1} className="mt-6 font-display text-2xl font-extrabold tracking-tight outline-none sm:text-3xl">
        Inscrição confirmada!
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-slate-600">
        {primeiroNome ? `Boa sorte, ${primeiroNome}! ` : "Boa sorte! "}
        Você já está concorrendo no sorteio do CISBAF na fswk26.
      </p>
      <p className="mx-auto mt-5 max-w-sm rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
        Fique de olho no WhatsApp e no e-mail que você informou.
      </p>
      <button
        type="button"
        onClick={onNovaInscricao}
        className="mt-6 rounded-full px-4 py-2 text-sm font-semibold text-magenta underline-offset-4 hover:underline focus-visible:ring-4 focus-visible:ring-magenta/20 focus-visible:outline-none"
      >
        Inscrever outra pessoa
      </button>
    </div>
  );
}
