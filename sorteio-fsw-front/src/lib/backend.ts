import "server-only";

const BACKEND_URL = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");

type BackendInit = Omit<RequestInit, "body"> & { token?: string; body?: unknown };

/**
 * Chamada servidor-a-servidor ao Spring. O navegador nunca fala com o backend: ele só existe em BACKEND_URL,
 * que pode (e deve) ficar fechado para a internet. Falha de rede vira 503 para quem chama tratar como os demais erros.
 */
export async function backend(caminho: string, { token, body, headers, ...init }: BackendInit = {}): Promise<Response> {
  try {
    return await fetch(`${BACKEND_URL}${caminho}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error(`[backend] ${init.method ?? "GET"} ${caminho} falhou:`, error);
    return new Response(null, { status: 503 });
  }
}
