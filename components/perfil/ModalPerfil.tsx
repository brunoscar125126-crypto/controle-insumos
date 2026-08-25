"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  corPrimariaAtual: string | null;
  corSecundariaAtual: string | null;
  onFechar: () => void;
  onSalvar: (formData: FormData) => Promise<void>;
}

const COR_PRIMARIA_PADRAO = "#047857";
const COR_SECUNDARIA_PADRAO = "#ecfdf5";

function corValida(valor: string) {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(valor.trim());
}

/** Expande #abc pra #aabbcc — <input type="color"> só aceita hex de 6 dígitos. */
function paraSeisDigitos(hex: string): string {
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
}

function CampoCor({
  label,
  valor,
  onChange,
}: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  const valido = corValida(valor);
  return (
    <div>
      <label className="block text-xs text-stone-500 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={valido ? paraSeisDigitos(valor) : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`Seletor de ${label.toLowerCase()}`}
          className="w-9 h-9 rounded-lg border border-stone-300 cursor-pointer p-0.5 bg-white flex-shrink-0"
        />
        <input
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#047857"
          className={`flex-1 h-9 px-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
            valido ? "border-stone-300" : "border-red-300"
          }`}
        />
      </div>
    </div>
  );
}

export default function ModalPerfil({ corPrimariaAtual, corSecundariaAtual, onFechar, onSalvar }: Props) {
  const [corPrimaria, setCorPrimaria] = useState(corPrimariaAtual ?? COR_PRIMARIA_PADRAO);
  const [corSecundaria, setCorSecundaria] = useState(corSecundariaAtual ?? COR_SECUNDARIA_PADRAO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const primariaValida = corValida(corPrimaria);
  const secundariaValida = corValida(corSecundaria);

  async function handleSalvar() {
    if (!primariaValida || !secundariaValida) {
      setErro("Use um hex válido nas duas cores, tipo #047857.");
      return;
    }

    const formData = new FormData();
    formData.set("corPrimaria", corPrimaria);
    formData.set("corSecundaria", corSecundaria);

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
          <h2 className="text-base font-medium text-stone-900">Cores do app</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-stone-500 -mt-1">
            Cores do tema do app — vieram do logo no cadastro, mas pode ajustar em hex quando quiser.
          </p>

          <CampoCor label="Cor primária" valor={corPrimaria} onChange={setCorPrimaria} />
          <CampoCor label="Cor secundária" valor={corSecundaria} onChange={setCorSecundaria} />

          <div className="rounded-lg overflow-hidden border border-stone-200">
            <div
              className="px-3 py-2 text-xs font-medium text-white"
              style={{ backgroundColor: primariaValida ? corPrimaria : "#e7e5e4" }}
            >
              Pré-visualização — primária
            </div>
            <div
              className="px-3 py-2 text-xs text-stone-700"
              style={{ backgroundColor: secundariaValida ? corSecundaria : "#fafaf9" }}
            >
              Pré-visualização — secundária
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
              disabled={salvando}
              className="flex-1 h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {salvando && <Loader2 size={14} className="animate-spin" />}
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
