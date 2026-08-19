import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * "/" nunca renderiza nada — só decide pra onde mandar o usuário:
 * login → onboarding (se ainda não tem estabelecimento) → /insumos.
 */
export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!estabelecimento) redirect("/onboarding");

  redirect("/insumos");
}
