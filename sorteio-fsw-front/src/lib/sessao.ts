import "server-only";
import { cookies } from "next/headers";

const COOKIE_ADMIN = "sorteio_admin";

/** Token JWT do admin. Fica só em cookie HTTP-only deste domínio; o JavaScript da página nunca enxerga. */
export async function tokenAdmin(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE_ADMIN)?.value;
}

export async function iniciarSessao(token: string, expiraEmSegundos: number) {
  (await cookies()).set(COOKIE_ADMIN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    sameSite: "strict",
    path: "/",
    maxAge: expiraEmSegundos,
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_ADMIN);
}
