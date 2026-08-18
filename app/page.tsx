import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * "/" nunca renderiza nada — só decide pra onde mandar o usuário:
 * login → onboarding (se ainda não tem estabelecimento) → /insumos.
 */
export default async function Home() {
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

  if (!estabelecimento) redirect("/onboarding");

  redirect("/insumos");
}
