export type Unidade = "un" | "kg" | "g" | "l" | "ml" | "pacote" | "caixa";

export const UNIDADES: Unidade[] = ["un", "kg", "g", "l", "ml", "pacote", "caixa"];

export interface Estabelecimento {
  id: string;
  userId: string;
  nome: string;
  logoUrl: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
}

export interface Categoria {
  id: string;
  estabelecimentoId: string;
  nome: string;
}

export interface Insumo {
  id: string;
  estabelecimentoId: string;
  categoriaId: string;
  nome: string;
  quantidade: number;
  unidade: Unidade;
  fotoUrl: string | null;
}

/** Insumo com o nome da categoria já resolvido, pra exibir na lista. */
export interface InsumoComCategoria extends Insumo {
  categoriaNome: string;
}
