"use client";

import { useActionState } from "react";
import { IconeAlerta } from "@/components/icones";
import { entrar, type EstadoLogin } from "../actions";

const campo =
  "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 transition outline-none focus:border-magenta focus:ring-4 focus:ring-magenta/15";

export default function FormularioLogin({ sessaoExpirada }: { sessaoExpirada: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrar, {});
  const aviso = estado.erro ?? (sessaoExpirada ? "Sua sessão expirou. Entre novamente." : null);

  return (
    <form action={acao} className="mt-6 space-y-4">
      {aviso && !enviando && (
        <div role="alert" className="flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          <IconeAlerta className="mt-0.5 size-5 shrink-0" />
          <p>{aviso}</p>
        </div>
      )}
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-800">
          Usuário
        </label>
        <input
          id="username"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          className={campo}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-800">
          Senha
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={campo} />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-noite-900 font-display font-bold text-white transition hover:bg-noite-700 focus-visible:ring-4 focus-visible:ring-noite-700/30 focus-visible:outline-none disabled:cursor-wait disabled:opacity-70"
      >
        {enviando && <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
