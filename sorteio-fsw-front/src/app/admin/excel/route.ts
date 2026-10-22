import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { tokenAdmin } from "@/lib/sessao";

const TIPO_EXCEL = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Download da planilha: confere a sessão aqui e o backend confere o token de novo. O arquivo passa direto, sem cache. */
export async function GET(request: Request) {
  const paraLogin = () => NextResponse.redirect(new URL("/admin/login?expirada=1", request.url));

  const token = await tokenAdmin();
  if (!token) return paraLogin();

  const resposta = await backend("/participante/excel", { token, headers: { Accept: TIPO_EXCEL } });
  if (resposta.status === 401 || resposta.status === 403) return paraLogin();
  if (!resposta.ok || !resposta.body) {
    return new Response("Não foi possível gerar a planilha agora. Volte ao painel e tente novamente.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(resposta.body, {
    headers: {
      "Content-Type": TIPO_EXCEL,
      "Content-Disposition": resposta.headers.get("content-disposition") ?? 'attachment; filename="participantes.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
