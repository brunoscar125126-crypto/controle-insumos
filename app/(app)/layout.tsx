import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Layout de toda a área logada (pós-onboarding). Busca o estabelecimento
 * do usuário e aplica cor_primaria/cor_secundaria como CSS vars — os
 * componentes filhos herdam via `var(--cor-primaria)` (ver tailwind.config.ts).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { userId: session.user.id },
    select: { corPrimaria: true, corSecundaria: true },
  });

  if (!estabelecimento) redirect("/onboarding");

  const temaStyle = {
    ...(estabelecimento.corPrimaria ? { "--cor-primaria": estabelecimento.corPrimaria } : {}),
    ...(estabelecimento.corSecundaria ? { "--cor-secundaria": estabelecimento.corSecundaria } : {}),
  } as React.CSSProperties;

  return (
    <div style={temaStyle} className="min-h-screen">
      {children}
    </div>
  );
}
