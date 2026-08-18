"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { extrairPaleta } from "@/lib/theme/extractPalette";

export default function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cores, setCores] = useState<{ corPrimaria: string; corSecundaria: string } | null>(null);
  const [extraindoCor, setExtraindoCor] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setLogoFile(arquivo);
    setLogoPreview(URL.createObjectURL(arquivo));
    setErro("");
    setExtraindoCor(true);
    try {
      const paleta = await extrairPaleta(arquivo);
      setCores(paleta);
    } catch {
      // extração falhou (ex: navegador sem suporte) — segue com fallback do tema padrão
      setCores(null);
    } finally {
      setExtraindoCor(false);
    }
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

    setSalvando(true);
    setErro("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada, faça login novamente.");

      // 1. cria o estabelecimento (a categoria "Outros" é criada automaticamente por trigger)
      const { data: estabelecimento, error: erroInsert } = await supabase
        .from("estabelecimentos")
        .insert({ user_id: user.id, nome: nome.trim() })
        .select("id")
        .single();
      if (erroInsert || !estabelecimento) throw erroInsert ?? new Error("Falha ao criar estabelecimento.");

      // 2. sobe o logo pro storage, dentro de logos/{estabelecimento_id}/
      const extensao = logoFile.name.split(".").pop() || "png";
      const caminho = `logos/${estabelecimento.id}/logo.${extensao}`;
      const { error: erroUpload } = await supabase.storage
        .from("establishment-assets")
        .upload(caminho, logoFile, { upsert: true, contentType: logoFile.type });
      if (erroUpload) throw erroUpload;

      const {
        data: { publicUrl },
      } = supabase.storage.from("establishment-assets").getPublicUrl(caminho);

      // 3. salva logo_url + tema extraído no estabelecimento
      const { error: erroUpdate } = await supabase
        .from("estabelecimentos")
        .update({
          logo_url: publicUrl,
          cor_primaria: cores?.corPrimaria ?? null,
          cor_secundaria: cores?.corSecundaria ?? null,
        })
        .eq("id", estabelecimento.id);
      if (erroUpdate) throw erroUpdate;

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
                <span className="text-xs">Enviar logo</span>
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

        {(extraindoCor || cores) && (
          <div className="flex items-center gap-2 text-xs text-stone-500">
            {extraindoCor ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Extraindo cores do logo...
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
          disabled={salvando || extraindoCor}
          className="w-full h-10 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {salvando && <Loader2 size={15} className="animate-spin" />}
          {salvando ? "Salvando..." : "Concluir cadastro"}
        </button>
      </div>
    </div>
  );
}
