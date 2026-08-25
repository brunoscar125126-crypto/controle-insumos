"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import CardInsumo from "./CardInsumo";
import type { InsumoComCategoria } from "@/lib/types";

interface Props {
  insumo: InsumoComCategoria;
  /** Só arrasta quando a lista está sem busca/filtro — reordenar um recorte da lista não tem uma posição global sem ambiguidade. */
  arrastavel: boolean;
  onEditar: (insumo: InsumoComCategoria) => void;
  onAlterarQuantidade: (id: string, delta: number) => void;
  onRemover: (id: string) => void;
}

export default function SortableCardInsumo({
  insumo,
  arrastavel,
  onEditar,
  onAlterarQuantidade,
  onRemover,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: insumo.id,
    disabled: !arrastavel,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-1">
      {arrastavel && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Arrastar ${insumo.nome} pra reordenar`}
          className="flex items-center justify-center w-5 text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
        >
          <GripVertical size={16} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <CardInsumo insumo={insumo} onEditar={onEditar} onAlterarQuantidade={onAlterarQuantidade} onRemover={onRemover} />
      </div>
    </div>
  );
}
