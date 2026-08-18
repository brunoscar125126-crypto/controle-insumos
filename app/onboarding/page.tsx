import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (estabelecimento) redirect("/insumos");

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-10">
      <OnboardingForm />
    </div>
  );
}
