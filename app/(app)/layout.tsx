import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout de toda a área logada (pós-onboarding). Busca o estabelecimento
 * do usuário e aplica cor_primaria/cor_secundaria como CSS vars — os
 * componentes filhos herdam via `var(--cor-primaria)` (ver tailwind.config.ts).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id, nome, logo_url, cor_primaria, cor_secundaria")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!estabelecimento) redirect("/onboarding");

  const temaStyle = {
    ...(estabelecimento.cor_primaria ? { "--cor-primaria": estabelecimento.cor_primaria } : {}),
    ...(estabelecimento.cor_secundaria ? { "--cor-secundaria": estabelecimento.cor_secundaria } : {}),
  } as React.CSSProperties;

  return (
    <div style={temaStyle} className="min-h-screen">
      {children}
    </div>
  );
}
