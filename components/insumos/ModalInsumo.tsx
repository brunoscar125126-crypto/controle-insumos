"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { UNIDADES, type Categoria, type InsumoComCategoria, type Unidade } from "@/lib/types";
import { redimensionarImagem } from "@/lib/image/resizeImage";
import { usePasteImage } from "@/lib/image/usePasteImage";
import CropperModal from "@/components/image/CropperModal";

interface Props {
  categorias: Categoria[];
  /** Presente = modo edição (pré-preenche os campos); ausente = cadastro de um novo insumo. */
  insumoParaEditar?: InsumoComCategoria;
  onFechar: () => void;
  onSalvar: (formData: FormData) => Promise<void>;
}

export default function ModalInsumo({ categorias, insumoParaEditar, onFechar, onSalvar }: Props) {
  const editando = Boolean(insumoParaEditar);

  const [nome, setNome] = useState(insumoParaEditar?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(insumoParaEditar?.categoriaId ?? categorias[0]?.id ?? "");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [usandoNovaCategoria, setUsandoNovaCategoria] = useState(categorias.length === 0);
  const [quantidade, setQuantidade] = useState(insumoParaEditar ? String(insumoParaEditar.quantidade) : "");
  const [unidade, setUnidade] = useState<Unidade>(insumoParaEditar?.unidade ?? UNIDADES[0]);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(insumoParaEditar?.fotoUrl ?? null);
  const [imagemParaCortar, setImagemParaCortar] = useState<string | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  function abrirParaCortar(arquivo: File) {
    setErro("");
    setImagemParaCortar(URL.createObjectURL(arquivo));
  }

  // Cola (Ctrl+V) uma foto do clipboard direto — mesmo caminho de quem
  // clica em "Adicionar foto", só que sem passar pelo seletor de arquivo.
  usePasteImage(abrirParaCortar);

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    abrirParaCortar(arquivo);
  }

  async function handleCropConfirmado(blob: Blob) {
    if (imagemParaCortar) URL.revokeObjectURL(imagemParaCortar);
    setImagemParaCortar(null);
    setErro("");
    setProcessandoFoto(true);
    try {
      const redimensionada = await redimensionarImagem(blob);
      const arquivoFinal = new File([redimensionada], "foto.jpg", { type: redimensionada.type });
      setFoto(arquivoFinal);
      setFotoPreview(URL.createObjectURL(arquivoFinal));
    } catch {
      setErro("Não foi possível processar essa imagem. Tenta outra.");
    } finally {
      setProcessandoFoto(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }

  function handleCropCancelado() {
    if (imagemParaCortar) URL.revokeObjectURL(imagemParaCortar);
    setImagemParaCortar(null);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  async function handleSalvar() {
    const categoriaFinal = usandoNovaCategoria ? novaCategoria.trim() : categoriaId;
    const quantidadeNum = Number(quantidade);

    if (!nome.trim()) {
      setErro("Digite o nome do insumo.");
      return;
    }
    if (!categoriaFinal) {
      setErro("Escolha ou crie uma categoria.");
      return;
    }
    if (quantidade === "" || Number.isNaN(quantidadeNum) || quantidadeNum < 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }

    const formData = new FormData();
    formData.set("nome", nome.trim());
    formData.set("quantidade", String(quantidadeNum));
    formData.set("unidade", unidade);
    if (usandoNovaCategoria) {
      formData.set("novaCategoriaNome", novaCategoria.trim());
    } else {
      formData.set("categoriaId", categoriaId);
    }
    // No modo edição, só manda "foto" se uma nova foi escolhida — sem
    // campo nenhum, a Server Action mantém a foto atual como está.
    if (foto) formData.set("foto", foto);

    setSalvando(true);
    setErro("");
    try {
      await onSalvar(formData);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar. Tenta de novo.");
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-stone-900">{editando ? "Editar insumo" : "Novo insumo"}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Foto do produto</label>
            <button
              type="button"
              onClick={() => inputFotoRef.current?.click()}
              disabled={processandoFoto}
              className="w-full h-24 rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 hover:bg-stone-50 overflow-hidden disabled:opacity-60"
            >
              {processandoFoto ? (
                <Loader2 size={20} className="animate-spin" />
              ) : fotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
              ) : (
                <>
                  <ImagePlus size={20} />
                  <span className="text-xs">Adicionar foto ou colar (Ctrl+V)</span>
                </>
              )}
            </button>
            <input ref={inputFotoRef} type="file" accept="image/*" onChange={handleFoto} className="hidden" />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Nome do insumo</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Farinha de trigo"
              className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Categoria</label>
            {!usandoNovaCategoria ? (
              <div className="flex gap-2">
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="flex-1 h-9 px-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setUsandoNovaCategoria(true)}
                  className="text-xs text-emerald-700 whitespace-nowrap px-2"
                >
                  + nova categoria
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="Nome da categoria"
                  className="flex-1 h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                {categorias.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUsandoNovaCategoria(false)}
                    className="text-xs text-stone-500 whitespace-nowrap px-2"
                  >
                    cancelar
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-stone-500 mb-1">Quantidade</label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="0"
                className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-stone-500 mb-1">Unidade</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as Unidade)}
                className="w-full h-9 px-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erro && <p className="text-xs text-red-600">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="flex-1 h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSalvar}
              disabled={salvando || processandoFoto}
              className="flex-1 h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {salvando && <Loader2 size={14} className="animate-spin" />}
              {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Salvar insumo"}
            </button>
          </div>
        </div>
      </div>

      {imagemParaCortar && (
        <CropperModal
          imagemSrc={imagemParaCortar}
          onCancelar={handleCropCancelado}
          onConfirmar={handleCropConfirmado}
        />
      )}
    </div>
  );
}
