import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TelaControleInsumos from "@/components/insumos/TelaControleInsumos";
import type { Categoria, InsumoComCategoria } from "@/lib/types";

export default async function InsumosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: estabelecimento } = await supabase
    .from("estabelecimentos")
    .select("id, nome, logo_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!estabelecimento) redirect("/onboarding");

  const { data: categorias } = await supabase
    .from("categorias")
    .select("*")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("nome");

  const { data: insumos } = await supabase
    .from("insumos")
    .select("*, categorias(nome)")
    .eq("estabelecimento_id", estabelecimento.id)
    .order("created_at", { ascending: false });

  const insumosComCategoria: InsumoComCategoria[] = (insumos ?? []).map((i: any) => ({
    ...i,
    categoria_nome: i.categorias?.nome ?? "Outros",
  }));

  return (
    <TelaControleInsumos
      estabelecimento={estabelecimento}
      categoriasIniciais={(categorias ?? []) as Categoria[]}
      insumosIniciais={insumosComCategoria}
    />
  );
}
