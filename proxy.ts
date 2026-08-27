import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

// Instância "leve" do NextAuth (sem adapter/Prisma) só pra checar a sessão
// no Proxy — mantém esse arquivo livre de dependências que precisam do
// runtime Node completo.
const { auth } = NextAuth(authConfig);

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/api/auth"];

// Imagens (logo/foto) são servidas sem checar sessão — mesmo comportamento
// de quando viviam num bucket R2 público (ver comentário nas próprias
// rotas). Sem isso, <img src="/api/.../foto"> nunca carrega deslogado, e
// nem sempre é o mesmo usuário logado que está vendo (ex: preview do card).
const ROTAS_PUBLICAS_REGEX = [/^\/api\/estabelecimentos\/[^/]+\/logo$/, /^\/api\/insumos\/[^/]+\/foto$/];

export default auth((req) => {
  const logado = !!req.auth;
  const rotaPublica =
    ROTAS_PUBLICAS.some((rota) => req.nextUrl.pathname.startsWith(rota)) ||
    ROTAS_PUBLICAS_REGEX.some((regex) => regex.test(req.nextUrl.pathname));

  if (!logado && !rotaPublica) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (logado && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/cadastro")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Roda em todas as rotas exceto assets estáticos e da própria Next.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
