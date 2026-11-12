import { NextResponse } from "next/server";
import { backend } from "@/lib/backend";
import { tokenAdmin } from "@/lib/sessao";

/** Certificado (JPEG) de um participante: confere a sessão aqui e o backend confere o token de novo. */
export async function GET(request: Request, { params }: RouteContext<"/admin/certificado/[id]">) {
  const paraLogin = () => NextResponse.redirect(new URL("/admin/login?expirada=1", request.url));
  const erro = (mensagem: string, status: number) =>
    new Response(mensagem, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

  const token = await tokenAdmin();
  if (!token) return paraLogin();

  const { id } = await params;
  if (!/^[1-9]\d{0,18}$/.test(id)) return erro("Participante inválido.", 400);

  const resposta = await backend(`/participante/${id}/certificado`, { token, headers: { Accept: "image/jpeg" } });
  if (resposta.status === 401 || resposta.status === 403) return paraLogin();
  if (resposta.status === 404) return erro("Participante não encontrado.", 404);
  if (!resposta.ok || !resposta.body) return erro("Não foi possível gerar o certificado agora. Volte ao painel e tente novamente.", 502);

  return new Response(resposta.body, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Disposition": resposta.headers.get("content-disposition") ?? 'attachment; filename="certificado.jpg"',
      "Cache-Control": "no-store",
    },
  });
}
