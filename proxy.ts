import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

// Instância "leve" do NextAuth (sem adapter/Prisma) só pra checar a sessão
// no Proxy — mantém esse arquivo livre de dependências que precisam do
// runtime Node completo.
const { auth } = NextAuth(authConfig);

const ROTAS_PUBLICAS = ["/login", "/api/auth"];

export default auth((req) => {
  const logado = !!req.auth;
  const rotaPublica = ROTAS_PUBLICAS.some((rota) => req.nextUrl.pathname.startsWith(rota));

  if (!logado && !rotaPublica) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (logado && req.nextUrl.pathname === "/login") {
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
