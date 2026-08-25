"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Store } from "lucide-react";
import { extrairPaleta } from "@/lib/theme/extractPalette";
import { redimensionarImagem } from "@/lib/image/resizeImage";
import { usePasteImage } from "@/lib/image/usePasteImage";
import CropperModal from "@/components/image/CropperModal";
import { criarEstabelecimento } from "@/app/onboarding/actions";

export default function OnboardingForm() {
  const router = useRouter();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [imagemParaCortar, setImagemParaCortar] = useState<string | null>(null);
  const [cores, setCores] = useState<{ corPrimaria: string; corSecundaria: string } | null>(null);
  const [processandoLogo, setProcessandoLogo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function abrirParaCortar(arquivo: File) {
    setErro("");
    setImagemParaCortar(URL.createObjectURL(arquivo));
  }

  // Cola (Ctrl+V) uma imagem do clipboard direto — mesmo caminho de quem
  // clica em "Enviar logo", só que sem passar pelo seletor de arquivo.
  usePasteImage(abrirParaCortar);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    abrirParaCortar(arquivo);
  }

  async function handleCropConfirmado(blob: Blob) {
    if (imagemParaCortar) URL.revokeObjectURL(imagemParaCortar);
    setImagemParaCortar(null);
    setErro("");
    setProcessandoLogo(true);
    try {
      // Redimensiona/comprime o recorte — é essa versão (menor) que vira
      // preview, extrai a paleta e é enviada pro servidor.
      const redimensionada = await redimensionarImagem(blob);
      const arquivoFinal = new File([redimensionada], "logo.jpg", { type: redimensionada.type });

      setLogoFile(arquivoFinal);
      setLogoPreview(URL.createObjectURL(arquivoFinal));

      try {
        const paleta = await extrairPaleta(arquivoFinal);
        setCores(paleta);
      } catch {
        // extração de cor falhou (ex: navegador sem suporte) — segue com fallback do tema padrão
        setCores(null);
      }
    } catch {
      setErro("Não foi possível processar essa imagem. Tenta outra.");
      setLogoFile(null);
      setLogoPreview(null);
    } finally {
      setProcessandoLogo(false);
      if (inputFotoRef.current) inputFotoRef.current.value = "";
    }
  }

  function handleCropCancelado() {
    if (imagemParaCortar) URL.revokeObjectURL(imagemParaCortar);
    setImagemParaCortar(null);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      setErro("Digite o nome do estabelecimento.");
      return;
    }
    if (!logoFile) {
      setErro("Envie o logo do estabelecimento.");
      return;
    }

    const formData = new FormData();
    formData.set("nome", nome.trim());
    formData.set("logo", logoFile);
    if (cores) {
      formData.set("corPrimaria", cores.corPrimaria);
      formData.set("corSecundaria", cores.corSecundaria);
    }

    setSalvando(true);
    setErro("");
    try {
      await criarEstabelecimento(formData);
      router.push("/insumos");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu pra salvar. Tenta de novo.");
      setSalvando(false);
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-stone-200 p-6">
      <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center mb-4">
        <Store size={20} className="text-white" />
      </div>
      <h1 className="text-base font-medium text-stone-900 mb-1">Bem-vindo!</h1>
      <p className="text-sm text-stone-500 mb-6">
        Antes de começar, conta um pouco sobre seu estabelecimento.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-stone-500 mb-1">Nome do estabelecimento</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Restaurante da Maria"
            className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs text-stone-500 mb-1">Logo</label>
          <button
            type="button"
            onClick={() => inputFotoRef.current?.click()}
            className="w-full h-28 rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 hover:bg-stone-50 overflow-hidden"
          >
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview vem de um blob: URL local, next/image não se aplica
              <img src={logoPreview} alt="Pré-visualização do logo" className="w-full h-full object-contain p-2" />
            ) : (
              <>
                <ImagePlus size={20} />
                <span className="text-xs">Enviar logo ou colar (Ctrl+V)</span>
              </>
            )}
          </button>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            onChange={handleLogo}
            className="hidden"
          />
        </div>

        {(processandoLogo || cores) && (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {processandoLogo ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Processando logo...
              </>
            ) : (
              cores && (
                <>
                  <span>Tema detectado:</span>
                  <span
                    className="w-5 h-5 rounded-full border border-stone-200"
                    style={{ backgroundColor: cores.corPrimaria }}
                    title={cores.corPrimaria}
                  />
                  <span
                    className="w-5 h-5 rounded-full border border-stone-200"
                    style={{ backgroundColor: cores.corSecundaria }}
                    title={cores.corSecundaria}
                  />
                </>
              )
            )}
          </div>
        )}

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando || processandoLogo}
          className="w-full h-10 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {salvando && <Loader2 size={15} className="animate-spin" />}
          {salvando ? "Salvando..." : "Concluir cadastro"}
        </button>
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
