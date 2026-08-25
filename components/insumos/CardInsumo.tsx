"use client";

import { Minus, Package, Plus, Trash2 } from "lucide-react";
import type { InsumoComCategoria } from "@/lib/types";

interface Props {
  insumo: InsumoComCategoria;
  onEditar: (insumo: InsumoComCategoria) => void;
  onAlterarQuantidade: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
}

export default function CardInsumo({ insumo, onEditar, onAlterarQuantidade, onRemover }: Props) {
  const critico = insumo.quantidade <= 3;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        critico ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => onEditar(insumo)}
        aria-label={`Editar ${insumo.nome}`}
        className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg -m-1 p-1 hover:bg-black/[0.03] transition"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 flex items-center justify-center">
          {insumo.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={insumo.fotoUrl} alt={insumo.nome} className="w-full h-full object-cover" />
          ) : (
            <Package size={20} className="text-stone-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">{insumo.nome}</p>
          <p className={`text-xs ${critico ? "text-red-600" : "text-stone-500"}`}>
            {insumo.categoriaNome}
            {critico ? " · estoque baixo" : ""}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onAlterarQuantidade(insumo.id, -1)}
          aria-label={`Remover uma unidade de ${insumo.nome}`}
          className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 transition"
        >
          <Minus size={14} />
        </button>
        <span className={`text-sm w-14 text-center font-medium ${critico ? "text-red-700" : "text-stone-800"}`}>
          {insumo.quantidade} {insumo.unidade}
        </span>
        <button
          onClick={() => onAlterarQuantidade(insumo.id, 1)}
          aria-label={`Adicionar uma unidade de ${insumo.nome}`}
          className="w-7 h-7 rounded border border-stone-300 flex items-center justify-center text-stone-600 hover:bg-stone-100 active:scale-95 transition"
        >
          <Plus size={14} />
        </button>
      </div>

      <button
        onClick={() => onRemover(insumo.id)}
        aria-label={`Excluir ${insumo.nome}`}
        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-600 transition flex-shrink-0"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
