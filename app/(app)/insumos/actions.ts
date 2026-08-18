"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Unidade } from "@/lib/types";

async function getEstabelecimentoId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada, faça login novamente.");

  const { data: estabelecimento, error } = await supabase
    .from("estabelecimentos")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (error || !estabelecimento) throw new Error("Estabelecimento não encontrado.");

  return estabelecimento.id as string;
}

/** Busca a categoria pelo nome ou cria se ainda não existir (find-or-create). */
async function resolverCategoria(
  supabase: Awaited<ReturnType<typeof createClient>>,
  estabelecimentoId: string,
  categoriaId: string | null,
  novaCategoriaNome: string | null
) {
  if (categoriaId) return categoriaId;

  const nome = (novaCategoriaNome ?? "").trim();
  if (!nome) throw new Error("Escolha ou crie uma categoria.");

  const { data, error } = await supabase
    .from("categorias")
    .upsert(
      { estabelecimento_id: estabelecimentoId, nome },
      { onConflict: "estabelecimento_id,nome", ignoreDuplicates: false }
    )
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Falha ao criar categoria.");

  return data.id as string;
}

export async function criarInsumo(formData: FormData) {
  const supabase = await createClient();
  const estabelecimentoId = await getEstabelecimentoId(supabase);

  const nome = String(formData.get("nome") ?? "").trim();
  const quantidade = Number(formData.get("quantidade"));
  const unidade = String(formData.get("unidade") ?? "") as Unidade;
  const categoriaId = (formData.get("categoriaId") as string) || null;
  const novaCategoriaNome = (formData.get("novaCategoriaNome") as string) || null;
  const foto = formData.get("foto") as File | null;

  if (!nome) throw new Error("Digite o nome do insumo.");
  if (Number.isNaN(quantidade) || quantidade < 0) throw new Error("Informe uma quantidade válida.");

  const categoriaIdFinal = await resolverCategoria(supabase, estabelecimentoId, categoriaId, novaCategoriaNome);

  let fotoUrl: string | null = null;
  if (foto && foto.size > 0) {
    const extensao = foto.name.split(".").pop() || "jpg";
    const caminho = `insumos/${estabelecimentoId}/${crypto.randomUUID()}.${extensao}`;
    const { error: erroUpload } = await supabase.storage
      .from("establishment-assets")
      .upload(caminho, foto, { contentType: foto.type });
    if (erroUpload) throw erroUpload;

    fotoUrl = supabase.storage.from("establishment-assets").getPublicUrl(caminho).data.publicUrl;
  }

  const { error } = await supabase.from("insumos").insert({
    estabelecimento_id: estabelecimentoId,
    categoria_id: categoriaIdFinal,
    nome,
    quantidade,
    unidade,
    foto_url: fotoUrl,
  });
  if (error) throw error;

  revalidatePath("/insumos");
}

export async function alterarQuantidade(insumoId: string, delta: number) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("alterar_quantidade_insumo", {
    insumo_id: insumoId,
    delta,
  });
  if (error) throw error;

  revalidatePath("/insumos");
}

export async function removerInsumo(insumoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("insumos").delete().eq("id", insumoId);
  if (error) throw error;

  revalidatePath("/insumos");
}
