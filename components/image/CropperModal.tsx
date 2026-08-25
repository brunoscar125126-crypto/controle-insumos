"use client";

import { useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2, X } from "lucide-react";
import { cortarImagem } from "@/lib/image/cropImage";

interface Props {
  imagemSrc: string;
  /** Largura/altura do recorte. 1 = quadrado (é como logo e foto de insumo aparecem em todo o app). */
  aspecto?: number;
  onCancelar: () => void;
  onConfirmar: (blob: Blob) => void;
}

export default function CropperModal({ imagemSrc, aspecto = 1, onCancelar, onConfirmar }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  function handleImagemCarregada(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(
      centerCrop(
        makeAspectCrop({ unit: "%", width: 90 }, aspecto, width, height),
        width,
        height
      )
    );
  }

  async function handleConfirmar() {
    const imagem = imgRef.current;
    if (!imagem || !crop) return;

    setProcessando(true);
    setErro("");
    try {
      const blob = await cortarImagem(imagem, crop);
      onConfirmar(blob);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra recortar essa imagem.");
      setProcessando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl p-4 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-stone-900">Ajustar imagem</h2>
          <button onClick={onCancelar} aria-label="Cancelar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center bg-stone-100 rounded-lg overflow-hidden">
          <ReactCrop crop={crop} onChange={(_, c) => setCrop(c)} aspect={aspecto}>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem local (object URL), next/image não se aplica */}
            <img
              ref={imgRef}
              src={imagemSrc}
              alt="Imagem a recortar"
              onLoad={handleImagemCarregada}
              className="max-h-[55vh] max-w-full"
            />
          </ReactCrop>
        </div>

        {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="flex-1 h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={processando || !crop}
            className="flex-1 h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {processando && <Loader2 size={14} className="animate-spin" />}
            {processando ? "Cortando..." : "Cortar e usar"}
          </button>
        </div>
      </div>
    </div>
  );
}
