"use client";

import { useState } from "react";
import { Loader2, Tag, Trash2, X } from "lucide-react";
import type { Categoria } from "@/lib/types";

interface Props {
  categorias: Categoria[];
  onFechar: () => void;
  onRemover: (categoriaId: string) => Promise<void>;
}

export default function ModalCategorias({ categorias, onFechar, onRemover }: Props) {
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  async function handleRemover(categoria: Categoria) {
    setErro("");
    setRemovendoId(categoria.id);
    try {
      await onRemover(categoria.id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra excluir essa categoria.");
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-stone-900">Categorias</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-stone-500 mb-3">
          Excluir uma categoria move os insumos dela pra &quot;Outros&quot; — nenhum insumo é apagado.
        </p>

        <div className="space-y-1.5">
          {categorias.map((categoria) => {
            const ehOutros = categoria.nome.trim().toLowerCase() === "outros";
            return (
              <div
                key={categoria.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 h-10"
              >
                <span className="flex items-center gap-2 text-sm text-stone-800 min-w-0">
                  <Tag size={14} className="text-stone-400 flex-shrink-0" />
                  <span className="truncate">{categoria.nome}</span>
                </span>
                {ehOutros ? (
                  <span className="text-xs text-stone-400 flex-shrink-0">padrão</span>
                ) : (
                  <button
                    onClick={() => handleRemover(categoria)}
                    disabled={removendoId === categoria.id}
                    aria-label={`Excluir categoria ${categoria.nome}`}
                    className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 transition flex-shrink-0 disabled:opacity-60"
                  >
                    {removendoId === categoria.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}

        <button
          type="button"
          onClick={onFechar}
          className="w-full h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 mt-4"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
