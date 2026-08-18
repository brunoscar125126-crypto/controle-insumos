export type Unidade = "un" | "kg" | "g" | "l" | "ml" | "pacote" | "caixa";

export const UNIDADES: Unidade[] = ["un", "kg", "g", "l", "ml", "pacote", "caixa"];

export interface Estabelecimento {
  id: string;
  user_id: string;
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  created_at: string;
}

export interface Categoria {
  id: string;
  estabelecimento_id: string;
  nome: string;
  created_at: string;
}

export interface Insumo {
  id: string;
  estabelecimento_id: string;
  categoria_id: string;
  nome: string;
  quantidade: number;
  unidade: Unidade;
  foto_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Insumo com o nome da categoria já resolvido, pra exibir na lista. */
export interface InsumoComCategoria extends Insumo {
  categoria_nome: string;
}
