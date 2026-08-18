import type { Estabelecimento } from "@/lib/types";

/**
 * Aplica as cores do estabelecimento como CSS vars no elemento raiz.
 * Chamado no layout de (app), depois que o estabelecimento é carregado.
 * As classes Tailwind `text-primaria`/`bg-secundaria` etc. (ver
 * tailwind.config.ts) leem essas vars, com fallback pro verde do mock.
 */
export function aplicarTema(estabelecimento: Pick<Estabelecimento, "cor_primaria" | "cor_secundaria">) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (estabelecimento.cor_primaria) {
    root.style.setProperty("--cor-primaria", estabelecimento.cor_primaria);
  }
  if (estabelecimento.cor_secundaria) {
    root.style.setProperty("--cor-secundaria", estabelecimento.cor_secundaria);
  }
}
