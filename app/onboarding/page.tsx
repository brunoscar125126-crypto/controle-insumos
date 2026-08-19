import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const estabelecimento = await prisma.estabelecimento.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (estabelecimento) redirect("/insumos");

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <OnboardingForm />
    </div>
  );
}
