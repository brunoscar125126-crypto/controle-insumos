"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

interface Props {
  email: string | null;
  temSenha: boolean;
  corPrimariaAtual: string | null;
  corSecundariaAtual: string | null;
  onFechar: () => void;
  onSalvarCores: (formData: FormData) => Promise<void>;
  onDefinirSenha: (formData: FormData) => Promise<void>;
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

export default function ModalPerfil({
  email,
  temSenha,
  corPrimariaAtual,
  corSecundariaAtual,
  onFechar,
  onSalvarCores,
  onDefinirSenha,
}: Props) {
  const [corPrimaria, setCorPrimaria] = useState(corPrimariaAtual ?? COR_PRIMARIA_PADRAO);
  const [corSecundaria, setCorSecundaria] = useState(corSecundariaAtual ?? COR_SECUNDARIA_PADRAO);
  const [erroCores, setErroCores] = useState("");
  const [salvandoCores, setSalvandoCores] = useState(false);

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [sucessoSenha, setSucessoSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const primariaValida = corValida(corPrimaria);
  const secundariaValida = corValida(corSecundaria);

  async function handleSalvarCores() {
    if (!primariaValida || !secundariaValida) {
      setErroCores("Use um hex válido nas duas cores, tipo #047857.");
      return;
    }

    const formData = new FormData();
    formData.set("corPrimaria", corPrimaria);
    formData.set("corSecundaria", corSecundaria);

    setSalvandoCores(true);
    setErroCores("");
    try {
      await onSalvarCores(formData);
    } catch (e) {
      setErroCores(e instanceof Error ? e.message : "Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvandoCores(false);
    }
  }

  async function handleDefinirSenha() {
    if (novaSenha.length < 8) {
      setErroSenha("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha("As senhas não são iguais.");
      return;
    }

    const formData = new FormData();
    formData.set("senha", novaSenha);

    setSalvandoSenha(true);
    setErroSenha("");
    setSucessoSenha(false);
    try {
      await onDefinirSenha(formData);
      setSucessoSenha(true);
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (e) {
      setErroSenha(e instanceof Error ? e.message : "Não deu pra salvar a senha. Tenta de novo.");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-stone-900">Perfil</h2>
          <button onClick={onFechar} aria-label="Fechar" className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium text-stone-700">Cores do app</p>
          <p className="text-xs text-stone-500 -mt-3">
            Vieram do logo no cadastro, mas pode ajustar em hex quando quiser.
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

          {erroCores && <p className="text-xs text-red-600">{erroCores}</p>}

          <button
            type="button"
            onClick={handleSalvarCores}
            disabled={salvandoCores}
            className="w-full h-9 rounded-lg bg-emerald-700 text-sm text-white hover:bg-emerald-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvandoCores && <Loader2 size={14} className="animate-spin" />}
            {salvandoCores ? "Salvando..." : "Salvar cores"}
          </button>
        </div>

        <div className="border-t border-stone-200 my-5" />

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-stone-700">Login por e-mail e senha</p>
            <p className="text-xs text-stone-500 mt-0.5">
              {temSenha ? (
                <>Já dá pra entrar com {email} e senha, sem precisar do Google.</>
              ) : (
                <>Defina uma senha pra poder entrar com {email ?? "seu e-mail"} sem precisar do Google.</>
              )}
            </p>
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">
              {temSenha ? "Nova senha" : "Senha"}
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Pelo menos 8 caracteres"
              className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Confirmar senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDefinirSenha()}
              placeholder="Repete a senha"
              className="w-full h-9 px-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {erroSenha && <p className="text-xs text-red-600">{erroSenha}</p>}
          {sucessoSenha && <p className="text-xs text-emerald-700">Senha salva.</p>}

          <button
            type="button"
            onClick={handleDefinirSenha}
            disabled={salvandoSenha}
            className="w-full h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {salvandoSenha && <Loader2 size={14} className="animate-spin" />}
            {salvandoSenha ? "Salvando..." : temSenha ? "Trocar senha" : "Definir senha"}
          </button>
        </div>

        <button
          type="button"
          onClick={onFechar}
          className="w-full h-9 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50 mt-5"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
